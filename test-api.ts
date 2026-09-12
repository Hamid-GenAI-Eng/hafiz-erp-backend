import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/config/database';
import { diary } from './src/models/schema';
import { eq } from 'drizzle-orm';

async function test() {
  const entries = await db.select().from(diary).where(eq(diary.status, 'pending')).limit(1);
  if (entries.length === 0) return;
  const entry = entries[0];
  
  console.log('Sending PUT to http://localhost:3001/api/diary/' + entry.id + '/ledger');
  const res = await fetch('http://localhost:3001/api/diary/' + entry.id + '/ledger', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: entry.customer_name,
      phone: entry.phone,
      cid: entry.customer_id
    })
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
  
  const after = await db.select().from(diary).where(eq(diary.id, entry.id)).limit(1);
  console.log('Status after API call:', after[0].status);
}
test();
