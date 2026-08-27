"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
class CrmService {
    // ----------------------------------------------------
    // Customers
    // ----------------------------------------------------
    static async getAllCustomers() {
        // Only return active customers (deleted_at is null)
        const result = await database_1.db.select()
            .from(schema_1.customers)
            .where((0, drizzle_orm_1.sql) `${schema_1.customers.deleted_at} IS NULL`)
            .orderBy(schema_1.customers.name);
        return result;
    }
    static async getCustomerById(id) {
        const result = await database_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.id, id)).limit(1);
        if (!result || result.length === 0)
            return null;
        return result[0];
    }
    static async createCustomer(data) {
        const newCustomer = {
            ...data,
            balance: data.balance || 0,
            total_charged: data.balance && data.balance > 0 ? data.balance : 0, // Initial balance setup
            total_paid: data.balance && data.balance < 0 ? Math.abs(data.balance) : 0,
            created_at: new Date(),
            updated_at: new Date()
        };
        await database_1.db.insert(schema_1.customers).values(newCustomer);
        return newCustomer;
    }
    static async updateCustomer(id, data, incomingVersion) {
        // OCC Check
        const existing = await this.getCustomerById(id);
        if (!existing)
            throw new Error('Customer not found');
        if (existing.version !== incomingVersion)
            throw new Error('409: Conflict - version mismatch');
        // Strip out read-only fields and metadata to prevent Drizzle errors
        const { id: _id, customer_number, created_at, updated_at, deleted_at, balance, total_charged, total_paid, device_id, version, ...safeData } = data;
        const updatedData = {
            ...safeData,
            version: existing.version + 1,
            updated_at: new Date()
        };
        await database_1.db.update(schema_1.customers).set(updatedData).where((0, drizzle_orm_1.eq)(schema_1.customers.id, id));
        return await this.getCustomerById(id);
    }
    static async deleteCustomer(id, incomingVersion) {
        // Soft delete
        const existing = await this.getCustomerById(id);
        if (!existing)
            throw new Error('Customer not found');
        if (existing.version !== incomingVersion)
            throw new Error('409: Conflict - version mismatch');
        await database_1.db.update(schema_1.customers).set({
            status: 'inactive',
            deleted_at: new Date(),
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.customers.id, id));
        return true;
    }
    // ----------------------------------------------------
    // Ledgers
    // ----------------------------------------------------
    static async getLedgerHistory(customerId) {
        const result = await database_1.db.select()
            .from(schema_1.ledgers)
            .where((0, drizzle_orm_1.eq)(schema_1.ledgers.customer_id, customerId))
            .orderBy(schema_1.ledgers.created_at);
        return result;
    }
    static async createLedgerEntry(data) {
        // Note: better-sqlite3 does not support async callbacks in db.transaction. 
        // Executing sequentially using db instead of tx.
        const custArray = await database_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.id, data.customer_id)).limit(1);
        if (!custArray || custArray.length === 0)
            throw new Error('Customer not found');
        const cust = custArray[0];
        const netChange = data.amount - data.payment_amount;
        const newRunningBalance = cust.balance + netChange;
        // 1. Insert Ledger
        const entry = {
            ...data,
            running_balance: newRunningBalance,
            created_at: new Date(),
            updated_at: new Date()
        };
        await database_1.db.insert(schema_1.ledgers).values(entry);
        // 2. Update Customer Cache
        await database_1.db.update(schema_1.customers).set({
            balance: newRunningBalance,
            total_charged: cust.total_charged + data.amount,
            total_paid: cust.total_paid + data.payment_amount,
            version: cust.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.customers.id, data.customer_id));
        return entry;
    }
    static async updateLedgerEntry(ledgerId, incomingVersion, data) {
        // Note: better-sqlite3 does not support async db.transaction callbacks.
        // Executing sequentially.
        // 1. Get existing ledger
        const existingLedgerArray = await database_1.db.select().from(schema_1.ledgers).where((0, drizzle_orm_1.eq)(schema_1.ledgers.id, ledgerId)).limit(1);
        if (!existingLedgerArray || existingLedgerArray.length === 0)
            throw new Error('Ledger entry not found');
        const existingLedger = existingLedgerArray[0];
        // OCC Check
        if (existingLedger.version !== incomingVersion) {
            throw new Error('409: Conflict - version mismatch');
        }
        // 2. Get customer
        const custArray = await database_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.id, existingLedger.customer_id)).limit(1);
        if (!custArray || custArray.length === 0)
            throw new Error('Customer not found');
        const cust = custArray[0];
        // 3. Calculate differences
        const amountDiff = data.amount - existingLedger.amount;
        const paymentDiff = data.payment_amount - existingLedger.payment_amount;
        const netChangeDiff = amountDiff - paymentDiff;
        const newRunningBalance = existingLedger.running_balance + netChangeDiff;
        const newCustomerBalance = cust.balance + netChangeDiff;
        // 4. Update Ledger
        const updatedLedger = {
            ...data,
            running_balance: newRunningBalance,
            version: existingLedger.version + 1,
            updated_at: new Date()
        };
        await database_1.db.update(schema_1.ledgers).set(updatedLedger).where((0, drizzle_orm_1.eq)(schema_1.ledgers.id, ledgerId));
        // 5. Update Customer
        await database_1.db.update(schema_1.customers).set({
            balance: newCustomerBalance,
            total_charged: cust.total_charged + amountDiff,
            total_paid: cust.total_paid + paymentDiff,
            version: cust.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.customers.id, cust.id));
        // 6. Recalculate subsequent running balances for this customer
        await this.recalculateCustomerLedger(cust.id);
        return updatedLedger;
    }
    static async recalculateCustomerLedger(customerId) {
        const allEntries = await database_1.db.select().from(schema_1.ledgers)
            .where((0, drizzle_orm_1.eq)(schema_1.ledgers.customer_id, customerId))
            .orderBy(schema_1.ledgers.date, schema_1.ledgers.time, schema_1.ledgers.created_at);
        let runningBalance = 0;
        for (const entry of allEntries) {
            runningBalance += (entry.amount - entry.payment_amount);
            if (entry.running_balance !== runningBalance) {
                await database_1.db.update(schema_1.ledgers)
                    .set({ running_balance: runningBalance })
                    .where((0, drizzle_orm_1.eq)(schema_1.ledgers.id, entry.id));
            }
        }
        // Ensure customer balance matches
        await database_1.db.update(schema_1.customers)
            .set({ balance: runningBalance })
            .where((0, drizzle_orm_1.eq)(schema_1.customers.id, customerId));
    }
}
exports.CrmService = CrmService;
