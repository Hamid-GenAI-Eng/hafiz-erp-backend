import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/config/database';
import { invoices, ledgers } from './src/models/schema';

async function test() {
  const invs = await db.select().from(invoices);
  console.log('Invoices count:', invs.length);
  
  const leds = await db.select().from(ledgers);
  console.log('Ledgers count:', leds.length);
}
test();
