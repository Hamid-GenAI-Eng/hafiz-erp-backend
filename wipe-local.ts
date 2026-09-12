import Database from 'better-sqlite3';

async function wipeLocal() {
  console.log("Wiping Local SQLite Database using PRAGMA...");
  
  const sqlite = new Database('sqlite.db');
  
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
  
  console.log("Local Database wiped successfully.");
}

wipeLocal().catch(err => {
  console.error("Error wiping local DB:", err);
});
