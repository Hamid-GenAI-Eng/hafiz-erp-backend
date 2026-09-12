import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/config/database';
import { customers, products, invoices, diary } from './src/models/schema';
import postgres from 'postgres';

async function check() {
  console.log("Local SQLite Counts:");
  console.log("Customers:", (await db.select().from(customers)).length);
  console.log("Products:", (await db.select().from(products)).length);
  console.log("Invoices:", (await db.select().from(invoices)).length);
  console.log("Diary:", (await db.select().from(diary)).length);
  
  console.log("\nProd Postgres Counts:");
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
