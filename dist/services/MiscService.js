"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscService = void 0;
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
class MiscService {
    static async getAllExpenses() {
        return await database_1.db.select().from(schema_1.misc_expenses).where((0, drizzle_orm_1.sql) `${schema_1.misc_expenses.deleted_at} IS NULL`).orderBy((0, drizzle_orm_1.sql) `${schema_1.misc_expenses.date} DESC`);
    }
    static async getExpenseById(id) {
        return (await database_1.db.select().from(schema_1.misc_expenses).where((0, drizzle_orm_1.eq)(schema_1.misc_expenses.id, id)).limit(1))[0];
    }
    static async createExpense(data) {
        const inserted = await database_1.db.insert(schema_1.misc_expenses).values({
            id: (0, crypto_1.randomUUID)(),
            date: data.date,
            time: data.time || new Date().toISOString().split('T')[1].slice(0, 5),
            category: data.category,
            amount: data.amount,
            description: data.description || '',
            type: data.type || 'expense',
            version: 1,
            created_at: new Date(),
            updated_at: new Date()
        }).returning();
        return inserted[0];
    }
    static async updateExpense(id, data, version) {
        const existing = await this.getExpenseById(id);
        if (!existing)
            throw new Error('404: Expense not found');
        if (existing.version !== version)
            throw new Error('409: Conflict');
        const updated = await database_1.db.update(schema_1.misc_expenses).set({
            date: data.date,
            time: data.time,
            category: data.category,
            amount: data.amount,
            description: data.description,
            type: data.type || existing.type,
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.misc_expenses.id, id)).returning();
        return updated[0];
    }
    static async deleteExpense(id, version) {
        const existing = await this.getExpenseById(id);
        if (!existing)
            throw new Error('404: Expense not found');
        if (existing.version !== version)
            throw new Error('409: Conflict');
        await database_1.db.update(schema_1.misc_expenses)
            .set({ deleted_at: new Date(), updated_at: new Date(), version: existing.version + 1 })
            .where((0, drizzle_orm_1.eq)(schema_1.misc_expenses.id, id));
        return true;
    }
}
exports.MiscService = MiscService;
