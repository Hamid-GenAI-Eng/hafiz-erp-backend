const Database = require('better-sqlite3');
const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
const path = require('path');
const fs = require('fs');

console.log("Loaded Database and Drizzle");
const sqlite = new Database(':memory:');
const db = drizzleSqlite(sqlite);
const migrationsFolder = path.join(__dirname, 'drizzle/sqlite');
console.log("Migrating from", migrationsFolder);
if (fs.existsSync(migrationsFolder)) {
  migrate(db, { migrationsFolder });
  console.log("Migrated successfully");
} else {
  console.log("Migrations folder not found");
}
