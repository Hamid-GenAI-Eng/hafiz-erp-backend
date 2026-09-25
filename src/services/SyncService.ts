import { getDb } from '../config/database';
import * as schema from '../models/schema';
import { eq, gt } from 'drizzle-orm';

const SYNCABLE_TABLES = [
  'customers', 'ledgers', 'suppliers', 'supplier_ledgers', 'products',
  'settings', 'logistics_vehicles', 'logistics_employees', 'logistics_expenses',
  'logistics_bucket_rentals', 'misc_expenses', 'invoices', 'invoice_items',
  'diary', 'diary_items', 'diary_notes'
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

    for (const tableName of SYNCABLE_TABLES) {
      const table = (schema as any)[tableName];
      if (!table || !clientChanges[tableName]) continue;

      let inserted = 0;
      let updated = 0;
      let ignored = 0;

      for (const clientRow of clientChanges[tableName]) {
        // Convert dates if necessary (client sends ISO strings)
        const rowData = { ...clientRow };
        if (rowData.created_at) rowData.created_at = new Date(rowData.created_at);
        else rowData.created_at = new Date();

        if (rowData.updated_at) rowData.updated_at = new Date(rowData.updated_at);
        else rowData.updated_at = rowData.created_at;

        if (rowData.deleted_at) rowData.deleted_at = new Date(rowData.deleted_at);
        else rowData.deleted_at = null;

        const existingArray = await getDb().select().from(table).where(eq(table.id, rowData.id)).limit(1);
        const existing = existingArray[0];

        if (!existing) {
          await getDb().insert(table).values(rowData);
          inserted++;
        } else {
          // Last-Write-Wins (LWW) or version-based conflict resolution
          const clientTime = rowData.updated_at ? rowData.updated_at.getTime() : 0;
          const serverTime = existing.updated_at ? existing.updated_at.getTime() : 0;

          if (clientTime > serverTime || rowData.version > existing.version) {
            await getDb().update(table).set(rowData).where(eq(table.id, rowData.id));
            updated++;
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
              
              // Clear existing local items for this invoice to prevent duplicates
              await getDb().delete(invoice_items).where(eq(invoice_items.invoice_id, rowData.id));

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
      }
      results[tableName] = { inserted, updated, ignored };
    }

    return results;
  }
}
