"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.DB_TYPE = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
exports.DB_TYPE = process.env.VERCEL ? 'postgres' : (process.env.DB_TYPE || 'sqlite'); // 'sqlite' or 'postgres'
let db; // We will use a generic wrapper or cast as needed
if (exports.DB_TYPE === 'postgres') {
    // Hide from pkg bundler to prevent desktop app crash
    const pgModule = 'postgres';
    const postgres = require(pgModule);
    const { drizzle: drizzlePg } = require('drizzle-orm/' + pgModule + '-js');
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hafizerp';
    const queryClient = postgres(connectionString, { ssl: connectionString.includes('localhost') ? false : 'require' });
    exports.db = db = drizzlePg(queryClient);
    console.log('Connected to PostgreSQL');
}
else {
    try {
        // Hide require from bundler to prevent Vercel crashes
        const moduleName = 'better-sqlite3';
        const Database = require(moduleName);
        const { drizzle: drizzleSqlite } = require('drizzle-orm/' + moduleName);
        let dbPath = path_1.default.join(process.cwd(), 'sqlite.db');
        // Use home directory only if packaged as a binary (Tauri/pkg)
        if (process.pkg || process.env.NODE_ENV === 'production' && !fs_1.default.existsSync(dbPath)) {
            const dbDir = path_1.default.join(os_1.default.homedir(), '.hafizerp');
            if (!fs_1.default.existsSync(dbDir)) {
                fs_1.default.mkdirSync(dbDir, { recursive: true });
            }
            dbPath = path_1.default.join(dbDir, 'sqlite.db');
        }
        const sqlite = new Database(dbPath);
        exports.db = db = drizzleSqlite(sqlite);
        console.log(`SQLite path: ${dbPath}`);
        console.log(`Schema version: Drizzle managed`);
        // Apply migrations automatically if not Vercel
        try {
            const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
            let migrationsFolder = path_1.default.join(process.cwd(), 'drizzle/sqlite');
            if (!fs_1.default.existsSync(migrationsFolder)) {
                migrationsFolder = path_1.default.join(__dirname, '../../drizzle/sqlite');
            }
            if (fs_1.default.existsSync(migrationsFolder)) {
                migrate(db, { migrationsFolder });
                console.log('SQLite database schema initialized/verified successfully via Drizzle.');
            }
            else {
                console.warn('SQLite migrations folder not found at', migrationsFolder);
            }
        }
        catch (migrateErr) {
            console.error('Failed to run SQLite schema init:', migrateErr);
        }
    }
    catch (error) {
        console.error('Failed to initialize SQLite:', error);
        exports.db = db = null;
    }
}
