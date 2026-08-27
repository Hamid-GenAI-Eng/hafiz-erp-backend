import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import fs from 'fs';

dotenv.config();

export const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'postgres'

let db: any; // We will use a generic wrapper or cast as needed

if (DB_TYPE === 'postgres') {
  const queryClient = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hafizerp');
  db = drizzlePg(queryClient);
  console.log('Connected to PostgreSQL (Supabase)');
} else {
  // Conditionally require to prevent Vercel crashes
  const Database = require('better-sqlite3');
  const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');
  
  const dbDir = path.join(os.homedir(), '.hafizerp');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'sqlite.db');
  const sqlite = new Database(dbPath);
  db = drizzleSqlite(sqlite);
  console.log('Connected to local SQLite database at ' + dbPath);
}

export { db };
