import { db } from '../config/database';
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

      const rows = await db.select().from(table).where(gt(table.updated_at, lastSync));
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
        if (rowData.updated_at) rowData.updated_at = new Date(rowData.updated_at);
        if (rowData.deleted_at) rowData.deleted_at = new Date(rowData.deleted_at);

        const existingArray = await db.select().from(table).where(eq(table.id, rowData.id)).limit(1);
        const existing = existingArray[0];

        if (!existing) {
          await db.insert(table).values(rowData);
          inserted++;
        } else {
          // Last-Write-Wins (LWW) or version-based conflict resolution
          const clientTime = rowData.updated_at ? rowData.updated_at.getTime() : 0;
          const serverTime = existing.updated_at ? existing.updated_at.getTime() : 0;

          if (clientTime > serverTime || rowData.version > existing.version) {
            await db.update(table).set(rowData).where(eq(table.id, rowData.id));
            updated++;
          } else {
            ignored++;
          }
        }
      }
      results[tableName] = { inserted, updated, ignored };
    }

    return results;
  }
}
