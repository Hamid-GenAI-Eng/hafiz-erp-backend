"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_TYPE = void 0;
exports.getDb = getDb;
exports.initializeDatabase = initializeDatabase;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const isPackaged = !!process.pkg || process.env.NODE_ENV === 'production';
exports.DB_TYPE = isPackaged ? 'sqlite' : (process.env.VERCEL ? 'postgres' : (process.env.DB_TYPE || 'sqlite'));
let dbInstance = null;
function getDb() {
    if (!dbInstance) {
        throw new Error('Database is not initialized or failed to connect.');
    }
    return dbInstance;
}
function initializeDatabase() {
    if (exports.DB_TYPE === 'postgres') {
        // Hide from pkg bundler to prevent desktop app crash
        const pgModule = 'postgres';
        const postgres = require(pgModule);
        const { drizzle: drizzlePg } = require('drizzle-orm/' + pgModule + '-js');
        const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hafizerp';
        const queryClient = postgres(connectionString, { ssl: connectionString.includes('localhost') ? false : 'require' });
        dbInstance = drizzlePg(queryClient);
        console.log('Runtime mode: Vercel/Postgres');
        console.log('Connected to PostgreSQL');
    }
    else {
        try {
            const Database = require('better-sqlite3');
            const { drizzle: drizzleSqlite } = require('drizzle-orm/better-sqlite3');
            let dbPath = path_1.default.join(process.cwd(), 'sqlite.db');
            // Use home directory only if packaged as a binary (Tauri/pkg)
            if (isPackaged && !fs_1.default.existsSync(dbPath)) {
                const dbDir = path_1.default.join(os_1.default.homedir(), '.hafizerp');
                if (!fs_1.default.existsSync(dbDir)) {
                    fs_1.default.mkdirSync(dbDir, { recursive: true });
                }
                dbPath = path_1.default.join(dbDir, 'sqlite.db');
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
                let migrationsFolder = path_1.default.join(process.cwd(), 'drizzle/sqlite');
                if (!fs_1.default.existsSync(migrationsFolder)) {
                    migrationsFolder = path_1.default.join(__dirname, '../../drizzle/sqlite');
                }
                if (fs_1.default.existsSync(migrationsFolder)) {
                    migrate(dbInstance, { migrationsFolder });
                    console.log('SQLite database schema initialized/verified successfully via Drizzle.');
                }
                else {
                    console.warn('SQLite migrations folder not found at', migrationsFolder);
                }
            }
            catch (migrateErr) {
                console.error('Failed to run SQLite schema init:', migrateErr);
                throw migrateErr;
            }
            // Safe column migrations - add missing columns without crashing if they exist
            const safeAddColumn = (table, column, definition) => {
                try {
                    const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all();
                    const exists = cols.some((c) => c.name === column);
                    if (!exists) {
                        sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
                        console.log(`[Migration] Added column ${table}.${column}`);
                    }
                }
                catch (e) {
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
            const tableNames = tables.map((t) => t.name);
            const required = ['customers', 'diary_notes', 'products', 'sync_logs'];
            for (const req of required) {
                if (!tableNames.includes(req)) {
                    throw new Error(`Required table ${req} is missing from SQLite database!`);
                }
            }
            console.log(`DB object initialized: true`);
        }
        catch (error) {
            console.error('FATAL: Failed to initialize SQLite:', error);
            throw error;
        }
    }
}
