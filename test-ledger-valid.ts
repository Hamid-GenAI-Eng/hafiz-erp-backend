import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/config/database';
import { diary, customers } from './src/models/schema';
import { eq } from 'drizzle-orm';
import { DiaryService } from './src/services/DiaryService';

async function test() {
  const custArr = await db.select().from(customers).limit(1);
  const cust = custArr[0];

  const entries = await db.select().from(diary).where(eq(diary.status, 'pending')).limit(1);
  if (entries.length === 0) return;
  const entry = entries[0];

  // FORCE non-zero amounts
  await db.update(diary).set({ total_bill: 500, amount_paid: 100 }).where(eq(diary.id, entry.id));
  
  console.log('Testing migrateToLedger for PENDING diary entry with valid customer');
  
  try {
    const res = await DiaryService.migrateToLedger({
       cid: cust.id,
       name: cust.name,
       phone: cust.phone || '000',
       entryIds: [entry.id]
    });
    console.log('Result:', res);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
