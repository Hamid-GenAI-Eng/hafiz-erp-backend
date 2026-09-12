import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/config/database';
import { invoices, ledgers } from './src/models/schema';
import { desc } from 'drizzle-orm';

async function test() {
  const inv = await db.select().from(invoices).orderBy(desc(invoices.created_at)).limit(1);
  console.log('Latest invoice:', inv[0]);
  
  const led = await db.select().from(ledgers).orderBy(desc(ledgers.created_at)).limit(1);
  console.log('Latest ledger:', led[0]);
}
test();
