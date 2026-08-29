import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import fs from 'fs';

dotenv.config();

export const DB_TYPE = process.env.VERCEL ? 'postgres' : (process.env.DB_TYPE || 'sqlite'); // 'sqlite' or 'postgres'

let db: any; // We will use a generic wrapper or cast as needed

if (DB_TYPE === 'postgres') {
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
    console.log('Connected to local SQLite database at ' + dbPath);
  } catch (error) {
    console.error('Failed to initialize SQLite:', error);
    db = null;
  }
}

export { db };
