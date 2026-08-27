"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sync_logs = exports.diary_notes = exports.diary_items = exports.diary = exports.invoice_items = exports.invoices = exports.misc_expenses = exports.logistics_bucket_rentals = exports.logistics_expenses = exports.logistics_employees = exports.logistics_vehicles = exports.settings = exports.products = exports.supplier_ledgers = exports.suppliers = exports.ledgers = exports.customers = void 0;
const pgSchema = __importStar(require("./schema.pg"));
const sqliteSchema = __importStar(require("./schema.sqlite"));
const database_1 = require("../config/database");
exports.customers = (database_1.DB_TYPE === 'postgres' ? pgSchema.customers : sqliteSchema.customers);
exports.ledgers = (database_1.DB_TYPE === 'postgres' ? pgSchema.ledgers : sqliteSchema.ledgers);
exports.suppliers = (database_1.DB_TYPE === 'postgres' ? pgSchema.suppliers : sqliteSchema.suppliers);
exports.supplier_ledgers = (database_1.DB_TYPE === 'postgres' ? pgSchema.supplier_ledgers : sqliteSchema.supplier_ledgers);
exports.products = (database_1.DB_TYPE === 'postgres' ? pgSchema.products : sqliteSchema.products);
exports.settings = (database_1.DB_TYPE === 'postgres' ? pgSchema.settings : sqliteSchema.settings);
exports.logistics_vehicles = (database_1.DB_TYPE === 'postgres' ? pgSchema.logistics_vehicles : sqliteSchema.logistics_vehicles);
exports.logistics_employees = (database_1.DB_TYPE === 'postgres' ? pgSchema.logistics_employees : sqliteSchema.logistics_employees);
exports.logistics_expenses = (database_1.DB_TYPE === 'postgres' ? pgSchema.logistics_expenses : sqliteSchema.logistics_expenses);
exports.logistics_bucket_rentals = (database_1.DB_TYPE === 'postgres' ? pgSchema.logistics_bucket_rentals : sqliteSchema.logistics_bucket_rentals);
exports.misc_expenses = (database_1.DB_TYPE === 'postgres' ? pgSchema.misc_expenses : sqliteSchema.misc_expenses);
exports.invoices = (database_1.DB_TYPE === 'postgres' ? pgSchema.invoices : sqliteSchema.invoices);
exports.invoice_items = (database_1.DB_TYPE === 'postgres' ? pgSchema.invoice_items : sqliteSchema.invoice_items);
exports.diary = (database_1.DB_TYPE === 'postgres' ? pgSchema.diary : sqliteSchema.diary);
exports.diary_items = (database_1.DB_TYPE === 'postgres' ? pgSchema.diary_items : sqliteSchema.diary_items);
exports.diary_notes = (database_1.DB_TYPE === 'postgres' ? pgSchema.diary_notes : sqliteSchema.diary_notes);
exports.sync_logs = (database_1.DB_TYPE === 'postgres' ? pgSchema.sync_logs : sqliteSchema.sync_logs);
