import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/config/database';
import { diary } from './src/models/schema';
import { desc } from 'drizzle-orm';

async function test() {
  const entries = await db.select().from(diary).orderBy(desc(diary.updated_at)).limit(5);
  for (const entry of entries) {
    console.log(ID: , Status: , Customer: , Updated: );
  }
}
test();
