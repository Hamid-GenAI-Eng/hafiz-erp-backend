import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/config/database';
import { diary } from './src/models/schema';
import { eq } from 'drizzle-orm';
import { DiaryService } from './src/services/DiaryService';

async function test() {
  const entries = await db.select().from(diary).limit(1);
  if (entries.length === 0) {
    console.log('No diary entries found.');
    return;
  }
  const entry = entries[0];
  console.log('Testing migrateToLedger for diary entry:', entry.id);
  
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
