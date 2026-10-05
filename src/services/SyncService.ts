import { getDb } from '../config/database';
import * as schema from '../models/schema';
import { eq, gt } from 'drizzle-orm';

const SYNCABLE_TABLES = [
  // 1. Root Tables
  'settings', 'customers', 'suppliers', 'products', 'logistics_vehicles', 'logistics_employees', 'diary_notes',
  // 2. First-level dependencies (invoices, rentals, diary)
  'invoices', 'diary', 'logistics_bucket_rentals',
  // 3. Second-level dependencies (items, ledgers, expenses)
  'invoice_items', 'diary_items', 'ledgers', 'supplier_ledgers', 'logistics_expenses', 'misc_expenses'
];

export class SyncService {
  static async pullChanges(lastSync: Date) {
    const changes: any = {};
    
    for (const tableName of SYNCABLE_TABLES) {
      const table = (schema as any)[tableName];
      if (!table) continue;

      const rows = await getDb().select().from(table).where(gt(table.updated_at, lastSync));
      changes[tableName] = rows;
    }
    
    return changes;
  }

  static async pushChanges(clientChanges: any) {
    const results: any = {};
    const failedParentIds = new Set<string>();

    for (const tableName of SYNCABLE_TABLES) {
      const table = (schema as any)[tableName];
      if (!table || !clientChanges[tableName]) continue;

      let inserted = 0;
      let updated = 0;
      let ignored = 0;
      let resolved_collisions = 0;
      let failed = 0;

      for (const clientRow of clientChanges[tableName]) {
        try {
          // Convert dates if necessary (client sends ISO strings)
          const rowData = { ...clientRow };
          if (rowData.created_at) rowData.created_at = new Date(rowData.created_at);
          else rowData.created_at = new Date();

          if (rowData.updated_at) rowData.updated_at = new Date(rowData.updated_at);
          else rowData.updated_at = rowData.created_at;

          if (rowData.deleted_at) rowData.deleted_at = new Date(rowData.deleted_at);
          else rowData.deleted_at = null;

          // Foreign Key Safety Check
          if (rowData.customer_id && failedParentIds.has(rowData.customer_id)) throw new Error('Parent customer failed to sync');
          if (rowData.supplier_id && failedParentIds.has(rowData.supplier_id)) throw new Error('Parent supplier failed to sync');
          if (rowData.invoice_id && failedParentIds.has(rowData.invoice_id)) throw new Error('Parent invoice failed to sync');
          if (rowData.diary_id && failedParentIds.has(rowData.diary_id)) throw new Error('Parent diary failed to sync');
          if (rowData.vehicle_id && failedParentIds.has(rowData.vehicle_id)) throw new Error('Parent vehicle failed to sync');
          if (rowData.product_id && failedParentIds.has(rowData.product_id)) throw new Error('Parent product failed to sync');

          const existingArray = await getDb().select().from(table).where(eq(table.id, rowData.id)).limit(1);
          const existing = existingArray[0];

          if (!existing) {
            try {
              await getDb().insert(table).values(rowData);
              inserted++;
            } catch (insertError: any) {
              if (insertError.message && (insertError.message.includes('UNIQUE') || insertError.message.includes('SQLITE_CONSTRAINT_UNIQUE'))) {
                // Collision Resolution
                const shortId = Math.random().toString(36).substring(2, 6).toUpperCase();
                
                if (rowData.customer_number) rowData.customer_number = `${rowData.customer_number}-${shortId}`;
                if (rowData.supplier_number) rowData.supplier_number = `${rowData.supplier_number}-${shortId}`;
                if (rowData.sku) rowData.sku = `${rowData.sku}-${shortId}`;
                if (rowData.invoice_number) rowData.invoice_number = `${rowData.invoice_number}-${shortId}`;
                if (rowData.key) rowData.key = `${rowData.key}-${shortId}`;
                
                // Sync Back the Fix: bump updated_at
                rowData.updated_at = new Date();

                // Re-attempt
                await getDb().insert(table).values(rowData);
                resolved_collisions++;
              } else {
                throw insertError;
              }
            }
          } else {
            // Last-Write-Wins (LWW) or version-based conflict resolution
            const clientTime = rowData.updated_at ? rowData.updated_at.getTime() : 0;
            const serverTime = existing.updated_at ? existing.updated_at.getTime() : 0;

            if (clientTime > serverTime || rowData.version > existing.version) {
              try {
                await getDb().update(table).set(rowData).where(eq(table.id, rowData.id));
                updated++;
              } catch (updateError: any) {
                if (updateError.message && (updateError.message.includes('UNIQUE') || updateError.message.includes('SQLITE_CONSTRAINT_UNIQUE'))) {
                  const shortId = Math.random().toString(36).substring(2, 6).toUpperCase();
                  if (rowData.customer_number) rowData.customer_number = `${rowData.customer_number}-${shortId}`;
                  if (rowData.supplier_number) rowData.supplier_number = `${rowData.supplier_number}-${shortId}`;
                  if (rowData.sku) rowData.sku = `${rowData.sku}-${shortId}`;
                  if (rowData.invoice_number) rowData.invoice_number = `${rowData.invoice_number}-${shortId}`;
                  if (rowData.key) rowData.key = `${rowData.key}-${shortId}`;
                  rowData.updated_at = new Date();
                  await getDb().update(table).set(rowData).where(eq(table.id, rowData.id));
                  resolved_collisions++;
                } else {
                  throw updateError;
                }
              }
            } else {
              ignored++;
            }
          }

          // Handle Legacy Items payload for older remote servers or migrations
          if (tableName === 'invoices' && clientRow.items) {
            try {
              let legacyItems: any[] = [];
              if (typeof clientRow.items === 'string') {
                try { legacyItems = JSON.parse(clientRow.items); } catch (e) {}
              } else if (Array.isArray(clientRow.items)) {
                legacyItems = clientRow.items;
              }

              if (legacyItems.length > 0) {
                const { invoice_items } = require('../models/schema');
                const { randomUUID } = require('crypto');
                
                await getDb().update(invoice_items).set({ deleted_at: new Date(), updated_at: new Date() }).where(eq(invoice_items.invoice_id, rowData.id));

                for (const item of legacyItems) {
                  await getDb().insert(invoice_items).values({
                    id: item.id || randomUUID(),
                    invoice_id: rowData.id,
                    product_id: item.product_id || null,
                    description: item.description || '',
                    quantity: item.quantity || 0,
                    unit_price: item.unit_price || 0,
                    discount: item.discount || 0,
                    total_price: item.total_price || 0,
                    version: 1,
                    created_at: new Date(),
                    updated_at: new Date()
                  });
                }
              }
            } catch (err) {
              console.error(`Error migrating legacy items for invoice ${rowData.id}:`, err);
            }
          }

        } catch (err: any) {
          console.error(`Row sync failed for table ${tableName} (ID: ${clientRow.id}):`, err.message);
          failed++;
          failedParentIds.add(clientRow.id);
        }
      }
      
      results[tableName] = { inserted, updated, ignored, resolved_collisions, failed };
    }

    return results;
  }
}
