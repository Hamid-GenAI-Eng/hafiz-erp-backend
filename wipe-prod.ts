import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';

async function wipeProd() {
  console.log("Wiping Production PostgreSQL Database...");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in .env");
  }
  
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  
  const tables = [
    'sync_logs', 'diary_items', 'diary_notes', 'diary',
    'invoice_items', 'invoices',
    'misc_expenses', 'logistics_bucket_rentals', 'logistics_expenses', 'logistics_employees', 'logistics_vehicles',
    'supplier_ledgers', 'suppliers',
    'ledgers', 'customers',
    'products'
  ];
  
  const tableList = tables.join(', ');
  
  console.log("Executing TRUNCATE TABLE " + tableList + " CASCADE;");
  
  await sql.unsafe("TRUNCATE TABLE " + tableList + " CASCADE;");
  
  console.log("Production Database wiped successfully.");
  await sql.end();
}

wipeProd().catch(err => {
  console.error("Error wiping prod DB:", err);
  process.exit(1);
});
