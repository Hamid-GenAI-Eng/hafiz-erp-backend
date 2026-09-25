import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import fs from 'fs';

dotenv.config();

const isPackaged = !!(process as any).pkg || process.env.NODE_ENV === 'production';
export const DB_TYPE = isPackaged ? 'sqlite' : (process.env.VERCEL ? 'postgres' : (process.env.DB_TYPE || 'sqlite'));

let dbInstance: any = null;

export function getDb() {
  if (!dbInstance) {
    throw new Error('Database is not initialized or failed to connect.');
  }
  return dbInstance;
}

export function initializeDatabase(): void {
  if (DB_TYPE === 'postgres') {
    // Hide from pkg bundler to prevent desktop app crash
    const pgModule = 'postgres';
    const postgres = require(pgModule);
    const { drizzle: drizzlePg } = require('drizzle-orm/' + pgModule + '-js');
    
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hafizerp';
    const queryClient = postgres(connectionString, { ssl: connectionString.includes('localhost') ? false : 'require' });
    dbInstance = drizzlePg(queryClient);
    console.log('Runtime mode: Vercel/Postgres');
    console.log('Connected to PostgreSQL');
  } else {
    try {
      const Database = require('better-sqlite3');
      const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');
      
      let dbPath = path.join(process.cwd(), 'sqlite.db');
      
      // Use home directory only if packaged as a binary (Tauri/pkg)
      if (isPackaged && !fs.existsSync(dbPath)) {
        const dbDir = path.join(os.homedir(), '.hafizerp');
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
        dbPath = path.join(dbDir, 'sqlite.db');
      }

      console.log('Runtime mode: desktop');
      console.log('DB_TYPE: sqlite');
      console.log(`SQLite path: ${dbPath}`);

      const sqlite = new Database(dbPath);
      dbInstance = drizzleSqlite(sqlite);
      
      console.log(`Schema version: Drizzle managed`);

      // Apply migrations automatically if not Vercel
      try {
        const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
        let migrationsFolder = path.join(process.cwd(), 'drizzle/sqlite');
        if (!fs.existsSync(migrationsFolder)) {
          migrationsFolder = path.join(__dirname, '../../drizzle/sqlite');
        }
        
        if (fs.existsSync(migrationsFolder)) {
          migrate(dbInstance, { migrationsFolder });
          console.log('SQLite database schema initialized/verified successfully via Drizzle.');
        } else {
          console.warn('SQLite migrations folder not found at', migrationsFolder);
        }
      } catch (migrateErr) {
        console.error('Failed to run SQLite schema init:', migrateErr);
        throw migrateErr;
      }

      // Safe column migrations - add missing columns without crashing if they exist
      const safeAddColumn = (table: string, column: string, definition: string) => {
        try {
          const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as any[];
          const exists = cols.some((c: any) => c.name === column);
          if (!exists) {
            sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
            console.log(`[Migration] Added column ${table}.${column}`);
          }
        } catch (e: any) {
          console.warn(`[Migration] Could not add ${table}.${column}: ${e.message}`);
        }
      };

      // diary table columns
      safeAddColumn('diary', 'time', 'text');
      safeAddColumn('diary', 'outside_loader_fee', 'real DEFAULT 0 NOT NULL');
      safeAddColumn('diary', 'outside_loader_name', 'text');
      safeAddColumn('diary', 'outside_loader_phone', 'text');
      safeAddColumn('diary', 'discount', 'real DEFAULT 0 NOT NULL');

      // diary_items table columns
      safeAddColumn('diary_items', 'time', 'text');
      safeAddColumn('diary_items', 'discount', 'real DEFAULT 0 NOT NULL');

      console.log('[Migration] Safe column check complete.');

      // Verify required tables exist
      const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const tableNames = tables.map((t: any) => t.name);
      const required = ['customers', 'diary_notes', 'products', 'sync_logs'];
      for (const req of required) {
        if (!tableNames.includes(req)) {
          throw new Error(`Required table ${req} is missing from SQLite database!`);
        }
      }
      
      console.log(`DB object initialized: true`);
    } catch (error) {
      console.error('FATAL: Failed to initialize SQLite:', error);
      throw error;
    }
  }
}
