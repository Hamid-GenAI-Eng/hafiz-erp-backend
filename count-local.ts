import Database from 'better-sqlite3';
const sqlite = new Database('sqlite.db');
const tables = [
  'customers', 'products', 'diary', 'invoices'
];
for (const table of tables) {
  const row = sqlite.prepare(SELECT COUNT(*) as count FROM \).get();
  console.log(\ count: \);
}
