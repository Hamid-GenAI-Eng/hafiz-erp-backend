import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/config/database';
import { diary, customers } from './src/models/schema';
import { eq } from 'drizzle-orm';
import { DiaryService } from './src/services/DiaryService';

async function test() {
  const entries = await db.select().from(diary).where(eq(diary.status, 'pending')).limit(1);
  if (entries.length === 0) {
    console.log('No pending diary entries found.');
    return;
  }
  const entry = entries[0];
  // FORCE non-zero amounts
  await db.update(diary).set({ total_bill: 500, amount_paid: 100 }).where(eq(diary.id, entry.id));
  
  console.log('Testing migrateToLedger for PENDING diary entry with amounts:', entry.id);
  
  try {
    const res = await DiaryService.migrateToLedger({
       cid: entry.customer_id || 'test-cid',
       name: entry.customer_name || 'test-name',
       phone: entry.phone || '000',
       entryIds: [entry.id]
    });
    console.log('Result:', res);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
