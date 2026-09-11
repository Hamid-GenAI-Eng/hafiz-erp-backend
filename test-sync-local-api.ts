const express = require('express');
const cors = require('cors');
const syncRoutes = require('./src/routes/syncRoutes').default;
const { Database } = require('./src/config/database');
const { runSyncWorkerLogic } = require('./src/syncWorker');
const { randomUUID } = require('crypto');
const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');
const SqliteDatabase = require('better-sqlite3');
const postgres = require('postgres');
const { drizzle: drizzlePg } = require('drizzle-orm/postgres-js');
const { eq } = require('drizzle-orm');
const sqliteSchema = require('./src/models/schema.sqlite');
const pgSchema = require('./src/models/schema.pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/api/sync', syncRoutes);

const server = app.listen(3002, async () => {
  console.log('Local API running on port 3002');
  
  process.env.REMOTE_URL = 'http://localhost:3002';
  process.env.DB_TYPE = 'postgres';
  
  const sqliteDb = drizzleSqlite(new SqliteDatabase('sqlite.db'));
  const pgClient = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  const pgDb = drizzlePg(pgClient);

  const testId = randomUUID();
  const testProduct = {
    id: testId,
    sku: 'TEST-DEL-' + Date.now(),
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

  console.log('--- LOCAL -> REMOTE CREATE ---');
  await sqliteDb.insert(sqliteSchema.products).values({ ...testProduct, updated_at: new Date() });
  await runSyncWorkerLogic();
  
  const pgRes1 = await pgDb.select().from(pgSchema.products).where(eq(pgSchema.products.id, testId)).limit(1);
  console.log('Remote Create Exists:', pgRes1.length > 0 && pgRes1[0].name === 'Sync Test Product');

  console.log('--- LOCAL -> REMOTE DELETE ---');
  await sqliteDb.update(sqliteSchema.products).set({ deleted_at: new Date(), updated_at: new Date(), version: 2 }).where(eq(sqliteSchema.products.id, testId));
  await runSyncWorkerLogic();
  const pgRes3 = await pgDb.select().from(pgSchema.products).where(eq(pgSchema.products.id, testId)).limit(1);
  console.log('Remote Delete Exists:', pgRes3.length > 0 && pgRes3[0].deleted_at !== null);

  process.exit(0);
});

