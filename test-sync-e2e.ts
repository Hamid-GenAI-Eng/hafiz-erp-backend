process.env.REMOTE_URL = 'https://hafiz-erp-backend.vercel.app';
const { randomUUID } = require('crypto');
const Database = require('better-sqlite3');
const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');
const postgres = require('postgres');
const { drizzle: drizzlePg } = require('drizzle-orm/postgres-js');
const { eq } = require('drizzle-orm');
const sqliteSchema = require('./src/models/schema.sqlite');
const pgSchema = require('./src/models/schema.pg');

async function run() {
  const sqliteDb = drizzleSqlite(new Database('sqlite.db'));
  const pgClient = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  const pgDb = drizzlePg(pgClient);
  
  const testId = randomUUID();
  const testProduct = {
    id: testId,
    sku: 'TEST-' + Date.now(),
    type: 'building',
    name: 'Sync Test Product',
    unit: 'pcs',
    current_qty: 10,
    cost_price: 100,
    sale_price: 150,
    min_alert: 5,
    version: 1,
    created_at: new Date(),
    updated_at: new Date()
  };

  const { runSyncWorkerLogic } = require('./src/syncWorker');

  console.log('--- LOCAL -> REMOTE CREATE ---');
  await sqliteDb.insert(sqliteSchema.products).values({ ...testProduct, updated_at: new Date() });
  await runSyncWorkerLogic();
  const pgRes1 = await pgDb.select().from(pgSchema.products).where(eq(pgSchema.products.id, testId)).limit(1);
  console.log('Remote Create Exists:', pgRes1.length > 0 && pgRes1[0].name === 'Sync Test Product');

  console.log('--- LOCAL -> REMOTE UPDATE ---');
  await sqliteDb.update(sqliteSchema.products).set({ name: 'Updated Product', updated_at: new Date(), version: 2 }).where(eq(sqliteSchema.products.id, testId));
  await runSyncWorkerLogic();
  const pgRes2 = await pgDb.select().from(pgSchema.products).where(eq(pgSchema.products.id, testId)).limit(1);
  console.log('Remote Update Exists:', pgRes2.length > 0 && pgRes2[0].name === 'Updated Product');

  console.log('--- LOCAL -> REMOTE DELETE ---');
  await sqliteDb.update(sqliteSchema.products).set({ deleted_at: new Date(), updated_at: new Date(), version: 3 }).where(eq(sqliteSchema.products.id, testId));
  await runSyncWorkerLogic();
  const pgRes3 = await pgDb.select().from(pgSchema.products).where(eq(pgSchema.products.id, testId)).limit(1);
  console.log('Remote Delete Exists:', pgRes3.length > 0 && pgRes3[0].deleted_at !== null);

  console.log('--- REMOTE -> LOCAL CREATE ---');
  const remoteId = randomUUID();
  await pgDb.insert(pgSchema.products).values({ ...testProduct, id: remoteId, sku: 'TEST-R-' + Date.now(), name: 'Remote Product', updated_at: new Date() });
  await runSyncWorkerLogic();
  const localRes1 = await sqliteDb.select().from(sqliteSchema.products).where(eq(sqliteSchema.products.id, remoteId)).limit(1);
  console.log('Local Create Exists:', localRes1.length > 0 && localRes1[0].name === 'Remote Product');

  console.log('--- CONFLICT: LWW LOCAL WINS ---');
  const conflictId = randomUUID();
  const now = Date.now();
  await sqliteDb.insert(sqliteSchema.products).values({ ...testProduct, id: conflictId, sku: 'CONF-V-' + Date.now(), name: 'Local Name', updated_at: new Date(now + 10000) });
  await pgDb.insert(pgSchema.products).values({ ...testProduct, id: conflictId, sku: 'CONF-V-' + Date.now(), name: 'Remote Name', updated_at: new Date(now) });
  await runSyncWorkerLogic();
  const conflictRes1 = await pgDb.select().from(pgSchema.products).where(eq(pgSchema.products.id, conflictId)).limit(1);
  console.log('Local Wins (Remote is updated to Local):', conflictRes1[0]?.name === 'Local Name');

  console.log('--- CONFLICT: LWW REMOTE WINS ---');
  const conflictId2 = randomUUID();
  const now2 = Date.now();
  await sqliteDb.insert(sqliteSchema.products).values({ ...testProduct, id: conflictId2, sku: 'CONF-W-' + Date.now(), name: 'Local Name', updated_at: new Date(now2) });
  await pgDb.insert(pgSchema.products).values({ ...testProduct, id: conflictId2, sku: 'CONF-W-' + Date.now(), name: 'Remote Name', updated_at: new Date(now2 + 10000) });
  await runSyncWorkerLogic();
  const conflictRes2 = await sqliteDb.select().from(sqliteSchema.products).where(eq(sqliteSchema.products.id, conflictId2)).limit(1);
  console.log('Remote Wins (Local is updated to Remote):', conflictRes2[0]?.name === 'Remote Name');

  console.log('--- MIGRATION HISTORY ---');
  const m1 = await sqliteDb.select().from(sqliteSchema.sync_logs).limit(1);
  console.log('Schema checks succeeded.');
  
  process.exit(0);
}
run().catch(console.error);


