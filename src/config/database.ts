import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import fs from 'fs';

dotenv.config();

export const DB_TYPE = process.env.VERCEL ? 'postgres' : (process.env.DB_TYPE || 'sqlite'); // 'sqlite' or 'postgres'

let db: any; // We will use a generic wrapper or cast as needed

if (DB_TYPE === 'postgres') {
  // Hide from pkg bundler to prevent desktop app crash
  const pgModule = 'postgres';
  const postgres = require(pgModule);
  const { drizzle: drizzlePg } = require('drizzle-orm/' + pgModule + '-js');
  
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hafizerp';
  const queryClient = postgres(connectionString, { ssl: connectionString.includes('localhost') ? false : 'require' });
  db = drizzlePg(queryClient);
  console.log('Connected to PostgreSQL');
} else {
  try {
    // Hide require from bundler to prevent Vercel crashes
    const moduleName = 'better-sqlite3';
    const Database = require(moduleName);
    const { drizzle: drizzleSqlite } = require('drizzle-orm/' + moduleName);
    
    let dbPath = path.join(process.cwd(), 'sqlite.db');
    
    // Use home directory only if packaged as a binary (Tauri/pkg)
    if ((process as any).pkg || process.env.NODE_ENV === 'production' && !fs.existsSync(dbPath)) {
      const dbDir = path.join(os.homedir(), '.hafizerp');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      dbPath = path.join(dbDir, 'sqlite.db');
    }

    const sqlite = new Database(dbPath);
    db = drizzleSqlite(sqlite);
    console.log(`SQLite path: ${dbPath}`);
    console.log(`Schema version: Drizzle managed`);

    // Apply migrations automatically if not Vercel
    try {
      const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
      let migrationsFolder = path.join(process.cwd(), 'drizzle/sqlite');
      if (!fs.existsSync(migrationsFolder)) {
        migrationsFolder = path.join(__dirname, '../../drizzle/sqlite');
      }
      
      if (fs.existsSync(migrationsFolder)) {
        migrate(db, { migrationsFolder });
        console.log('SQLite database schema initialized/verified successfully via Drizzle.');
      } else {
        console.warn('SQLite migrations folder not found at', migrationsFolder);
      }
    } catch (migrateErr) {
      console.error('Failed to run SQLite schema init:', migrateErr);
    }
  } catch (error) {
    console.error('Failed to initialize SQLite:', error);
    db = null;
  }
}

export { db };
