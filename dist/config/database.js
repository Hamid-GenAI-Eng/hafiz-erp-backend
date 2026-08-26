"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.DB_TYPE = void 0;
const postgres_js_1 = require("drizzle-orm/postgres-js");
const better_sqlite3_1 = require("drizzle-orm/better-sqlite3");
const postgres_1 = __importDefault(require("postgres"));
const better_sqlite3_2 = __importDefault(require("better-sqlite3"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'postgres'
let db; // We will use a generic wrapper or cast as needed
if (exports.DB_TYPE === 'postgres') {
    const queryClient = (0, postgres_1.default)(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hafizerp');
    exports.db = db = (0, postgres_js_1.drizzle)(queryClient);
    console.log('Connected to PostgreSQL (Supabase)');
}
else {
    const sqlite = new better_sqlite3_2.default('sqlite.db');
    exports.db = db = (0, better_sqlite3_1.drizzle)(sqlite);
    console.log('Connected to local SQLite database');
}
