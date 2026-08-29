"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.DB_TYPE = void 0;
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
exports.DB_TYPE = process.env.VERCEL ? 'postgres' : (process.env.DB_TYPE || 'sqlite'); // 'sqlite' or 'postgres'
let db; // We will use a generic wrapper or cast as needed
if (exports.DB_TYPE === 'postgres') {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hafizerp';
    const queryClient = (0, postgres_1.default)(connectionString, { ssl: connectionString.includes('localhost') ? false : 'require' });
    exports.db = db = (0, postgres_js_1.drizzle)(queryClient);
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
        console.log('Connected to local SQLite database at ' + dbPath);
    }
    catch (error) {
        console.error('Failed to initialize SQLite:', error);
        exports.db = db = null;
    }
}
