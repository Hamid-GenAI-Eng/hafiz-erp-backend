import dotenv from 'dotenv';
dotenv.config();
import postgres from 'postgres';

async function check() {
  console.log("Prod Postgres Counts:");
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
  const [c] = await sqlSELECT COUNT(*) FROM customers;
  const [p] = await sqlSELECT COUNT(*) FROM products;
  const [i] = await sqlSELECT COUNT(*) FROM invoices;
  const [d] = await sqlSELECT COUNT(*) FROM diary;
  console.log("Customers:", c.count);
  console.log("Products:", p.count);
  console.log("Invoices:", i.count);
  console.log("Diary:", d.count);
  await sql.end();
}

check().catch(console.error);
