import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import postgres from 'postgres';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

export const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'postgres'

let db: any; // We will use a generic wrapper or cast as needed

if (DB_TYPE === 'postgres') {
  const queryClient = postgres(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hafizerp');
  db = drizzlePg(queryClient);
  console.log('Connected to PostgreSQL (Supabase)');
} else {
  const sqlite = new Database('sqlite.db');
  db = drizzleSqlite(sqlite);
  console.log('Connected to local SQLite database');
}

export { db };
