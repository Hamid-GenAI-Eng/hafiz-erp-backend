import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/config/database';
import { settings } from './src/models/schema';

async function test() {
  const sets = await db.select().from(settings);
  console.log(sets);
}
test();
