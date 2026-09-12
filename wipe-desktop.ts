import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

async function wipeDesktopLocal() {
  const dbDir = path.join(os.homedir(), '.hafizerp');
  const dbPath = path.join(dbDir, 'sqlite.db');
  console.log("Wiping Desktop Local SQLite Database at: " + dbPath);
  
  const sqlite = new Database(dbPath);
  
  sqlite.exec('PRAGMA foreign_keys = OFF;');
  
  const tables = [
    'sync_logs', 'diary_items', 'diary_notes', 'diary',
    'invoice_items', 'invoices',
    'misc_expenses', 'logistics_bucket_rentals', 'logistics_expenses', 'logistics_employees', 'logistics_vehicles',
    'supplier_ledgers', 'suppliers',
    'ledgers', 'customers',
    'products'
  ];
  
  for (const table of tables) {
    console.log("Deleting " + table + "...");
    sqlite.exec("DELETE FROM " + table + ";");
  }
  
  sqlite.exec('PRAGMA foreign_keys = ON;');
  
  console.log("Desktop Local Database wiped successfully.");
}

wipeDesktopLocal().catch(err => {
  console.error("Error wiping desktop local DB:", err);
});
