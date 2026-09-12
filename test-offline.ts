const { randomUUID } = require('crypto');
const SqliteDatabase = require('better-sqlite3');
const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');
const postgres = require('postgres');
const { drizzle: drizzlePg } = require('drizzle-orm/postgres-js');
const { eq } = require('drizzle-orm');
const sqliteSchema = require('./src/models/schema.sqlite');
const pgSchema = require('./src/models/schema.pg');
const { runSyncWorkerLogic } = require('./src/syncWorker');

async function run() {
  const sqliteDb = drizzleSqlite(new SqliteDatabase('sqlite.db'));
  const testId = randomUUID();
  const testProduct = {
    id: testId,
    sku: 'OFFLINE-' + Date.now(),
    type: 'building',
    name: 'Offline Product',
    unit: 'pcs',
    current_qty: 10,
    cost_price: 100,
    sale_price: 150,
    min_alert: 5,
    version: 1,
    created_at: new Date(),
    updated_at: new Date()
  };

  console.log('1. Inserting locally while offline...');
  await sqliteDb.insert(sqliteSchema.products).values(testProduct);

  process.env.REMOTE_URL = 'http://localhost:9999'; // broken URL
  try {
    await runSyncWorkerLogic();
  } catch(e) {
    console.log('2. Sync failed as expected (offline)');
  }

  console.log('3. Restarting backend...');
  const sqliteDb2 = drizzleSqlite(new SqliteDatabase('sqlite.db'));
  const check = await sqliteDb2.select().from(sqliteSchema.products).where(eq(sqliteSchema.products.id, testId)).limit(1);
  console.log('Local data still exists:', check.length > 0);

  console.log('4. Restoring connectivity to PRODUCTION VERCEL...');
  process.env.REMOTE_URL = 'https://hafiz-erp-backend.vercel.app';
  
  await runSyncWorkerLogic();
  console.log('5. Sync completed after restore');

  const pgClient = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  const pgDb = drizzlePg(pgClient);
  const pgRes = await pgDb.select().from(pgSchema.products).where(eq(pgSchema.products.id, testId)).limit(1);
  console.log('6. Data reaches Supabase:', pgRes.length > 0 && pgRes[0].name === 'Offline Product');
  
  process.exit(0);
}
run().catch(console.error);

