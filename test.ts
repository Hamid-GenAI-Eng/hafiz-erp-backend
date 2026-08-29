import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as pgSchema from './src/models/schema.pg';
import { eq } from 'drizzle-orm';

const queryClient = postgres('postgres://postgres.dmdnvmdrybxxoxppovjn:e3GARheMgYQUA295@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true', { ssl: 'require' });
const db = drizzle(queryClient, { schema: pgSchema });

async function run() {
  try {
    const table = pgSchema.supplier_ledgers;
    const existingArray = await db.select().from(table).where(eq(table.id, 'f69beba1-1228-48df-980e-fc856c39e8cb')).limit(1);
    console.log('Drizzle Select Result:', existingArray);
  } catch (error) {
    console.error('Detailed Error:', error);
  } finally {
    await queryClient.end();
  }
}
run();
