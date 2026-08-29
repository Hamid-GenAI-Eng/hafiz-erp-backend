"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
class SupplierService {
    // ----------------------------------------------------
    // Suppliers
    // ----------------------------------------------------
    static async getAllSuppliers() {
        // Only return active suppliers (deleted_at is null)
        const result = await database_1.db.select()
            .from(schema_1.suppliers)
            .where((0, drizzle_orm_1.sql) `${schema_1.suppliers.deleted_at} IS NULL`)
            .orderBy(schema_1.suppliers.company_name);
        return result;
    }
    static async getSupplierById(id) {
        const result = await database_1.db.select().from(schema_1.suppliers).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, id)).limit(1);
        if (!result || result.length === 0)
            return null;
        return result[0];
    }
    static async createSupplier(data) {
        const newSupplier = {
            ...data,
            balance_owed: data.balance_owed || 0,
            total_purchased: data.balance_owed && data.balance_owed > 0 ? data.balance_owed : 0,
            total_paid: data.balance_owed && data.balance_owed < 0 ? Math.abs(data.balance_owed) : 0,
            created_at: new Date(),
            updated_at: new Date()
        };
        await database_1.db.insert(schema_1.suppliers).values(newSupplier);
        return newSupplier;
    }
    static async updateSupplier(id, data, incomingVersion) {
        // OCC Check
        const existing = await this.getSupplierById(id);
        if (!existing)
            throw new Error('Supplier not found');
        if (existing.version !== incomingVersion)
            throw new Error('409: Conflict - version mismatch');
        // Strip out read-only fields and metadata to prevent Drizzle errors (e.g. getTime is not a function)
        const { id: _id, supplier_number, created_at, updated_at, deleted_at, balance_owed, total_purchased, total_paid, device_id, version, ...safeData } = data;
        const updatedData = {
            ...safeData,
            version: existing.version + 1,
            updated_at: new Date()
        };
        await database_1.db.update(schema_1.suppliers).set(updatedData).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, id));
        return await this.getSupplierById(id);
    }
    static async deleteSupplier(id, incomingVersion) {
        // Soft delete
        const existing = await this.getSupplierById(id);
        if (!existing)
            throw new Error('Supplier not found');
        if (existing.version !== incomingVersion)
            throw new Error('409: Conflict - version mismatch');
        await database_1.db.update(schema_1.suppliers).set({
            status: 'inactive',
            deleted_at: new Date(),
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, id));
        return true;
    }
    // ----------------------------------------------------
    // Supplier Ledgers
    // ----------------------------------------------------
    static async getLedgerHistory(supplierId) {
        const result = await database_1.db.select()
            .from(schema_1.supplier_ledgers)
            .where((0, drizzle_orm_1.eq)(schema_1.supplier_ledgers.supplier_id, supplierId))
            .orderBy(schema_1.supplier_ledgers.created_at);
        return result;
    }
    static async createLedgerEntry(data) {
        // Executing sequentially to avoid async transaction conflicts between SQLite and Postgres
        const suppArray = await database_1.db.select().from(schema_1.suppliers).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, data.supplier_id)).limit(1);
        if (!suppArray || suppArray.length === 0)
            throw new Error('Supplier not found');
        const supp = suppArray[0];
        // Net change for supplier: amount (purchases/debit) increase owed balance, payment_amount (payments/credit) decrease owed balance
        const netChange = data.amount - data.payment_amount;
        const newRunningBalance = supp.balance_owed + netChange;
        // 1. Insert Ledger
        const entry = {
            ...data,
            running_balance: newRunningBalance,
            created_at: new Date(),
            updated_at: new Date()
        };
        await database_1.db.insert(schema_1.supplier_ledgers).values(entry);
        // 2. Update Supplier Cache
        await database_1.db.update(schema_1.suppliers).set({
            balance_owed: newRunningBalance,
            total_purchased: supp.total_purchased + data.amount,
            total_paid: supp.total_paid + data.payment_amount,
            version: supp.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, data.supplier_id));
        return entry;
    }
    static async updateLedgerEntry(ledgerId, incomingVersion, data) {
        // Executing sequentially to avoid async transaction conflicts between SQLite and Postgres
        // 1. Get existing ledger
        const existingLedgerArray = await database_1.db.select().from(schema_1.supplier_ledgers).where((0, drizzle_orm_1.eq)(schema_1.supplier_ledgers.id, ledgerId)).limit(1);
        if (!existingLedgerArray || existingLedgerArray.length === 0)
            throw new Error('Ledger entry not found');
        const existingLedger = existingLedgerArray[0];
        // OCC Check
        if (existingLedger.version !== incomingVersion) {
            throw new Error('409: Conflict - version mismatch');
        }
        // 2. Get supplier
        const suppArray = await database_1.db.select().from(schema_1.suppliers).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, existingLedger.supplier_id)).limit(1);
        if (!suppArray || suppArray.length === 0)
            throw new Error('Supplier not found');
        const supp = suppArray[0];
        // 3. Calculate differences
        const amountDiff = data.amount - existingLedger.amount;
        const paymentDiff = data.payment_amount - existingLedger.payment_amount;
        const netChangeDiff = amountDiff - paymentDiff;
        const newRunningBalance = existingLedger.running_balance + netChangeDiff;
        const newSupplierBalance = supp.balance_owed + netChangeDiff;
        // 4. Update Ledger
        const updatedLedger = {
            ...data,
            running_balance: newRunningBalance,
            version: existingLedger.version + 1,
            updated_at: new Date()
        };
        await database_1.db.update(schema_1.supplier_ledgers).set(updatedLedger).where((0, drizzle_orm_1.eq)(schema_1.supplier_ledgers.id, ledgerId));
        // 5. Update Supplier
        await database_1.db.update(schema_1.suppliers).set({
            balance_owed: newSupplierBalance,
            total_purchased: supp.total_purchased + amountDiff,
            total_paid: supp.total_paid + paymentDiff,
            version: supp.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, supp.id));
        return updatedLedger;
    }
}
exports.SupplierService = SupplierService;
