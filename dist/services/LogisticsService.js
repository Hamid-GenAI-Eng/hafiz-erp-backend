"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsService = void 0;
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
class LogisticsService {
    // ----------------------------------------------------
    // VEHICLES
    // ----------------------------------------------------
    static async getAllVehicles() {
        return await database_1.db.select().from(schema_1.logistics_vehicles).where((0, drizzle_orm_1.sql) `${schema_1.logistics_vehicles.deleted_at} IS NULL`);
    }
    static async getVehicleById(id) {
        const res = await database_1.db.select().from(schema_1.logistics_vehicles).where((0, drizzle_orm_1.eq)(schema_1.logistics_vehicles.id, id)).limit(1);
        return res[0] || null;
    }
    static async createVehicle(data) {
        const inserted = await database_1.db.insert(schema_1.logistics_vehicles).values({
            id: (0, crypto_1.randomUUID)(),
            name: data.name,
            plate_number: data.plate_number,
            ownership: data.ownership || 'company',
            status: data.status || 'active',
            version: 1,
            created_at: new Date(),
            updated_at: new Date()
        }).returning();
        return inserted[0];
    }
    static async updateVehicle(id, data, version) {
        const existing = await this.getVehicleById(id);
        if (!existing)
            throw new Error('404: Vehicle not found');
        if (existing.version !== version)
            throw new Error('409: Conflict: Vehicle was modified by another device');
        const updated = await database_1.db.update(schema_1.logistics_vehicles).set({
            name: data.name,
            plate_number: data.plate_number,
            ownership: data.ownership,
            status: data.status,
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.logistics_vehicles.id, id)).returning();
        return updated[0];
    }
    static async deleteVehicle(id, version) {
        const existing = await this.getVehicleById(id);
        if (!existing)
            throw new Error('404: Vehicle not found');
        if (existing.version !== version)
            throw new Error('409: Conflict: Vehicle was modified by another device');
        await database_1.db.update(schema_1.logistics_vehicles).set({
            deleted_at: new Date(),
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.logistics_vehicles.id, id));
    }
    // ----------------------------------------------------
    // EMPLOYEES
    // ----------------------------------------------------
    static async getAllEmployees() {
        return await database_1.db.select().from(schema_1.logistics_employees).where((0, drizzle_orm_1.sql) `${schema_1.logistics_employees.deleted_at} IS NULL`);
    }
    static async getEmployeeById(id) {
        return (await database_1.db.select().from(schema_1.logistics_employees).where((0, drizzle_orm_1.eq)(schema_1.logistics_employees.id, id)).limit(1))[0];
    }
    static async createEmployee(data) {
        const inserted = await database_1.db.insert(schema_1.logistics_employees).values({
            id: (0, crypto_1.randomUUID)(),
            name: data.name,
            role: data.role,
            phone: data.phone,
            monthly_salary: data.monthly_salary || 0,
            status: data.status || 'active',
            version: 1,
            created_at: new Date(),
            updated_at: new Date()
        }).returning();
        return inserted[0];
    }
    static async updateEmployee(id, data, version) {
        const existing = (await database_1.db.select().from(schema_1.logistics_employees).where((0, drizzle_orm_1.eq)(schema_1.logistics_employees.id, id)).limit(1))[0];
        if (!existing)
            throw new Error('404: Employee not found');
        if (existing.version !== version)
            throw new Error('409: Conflict');
        const updated = await database_1.db.update(schema_1.logistics_employees).set({
            name: data.name,
            role: data.role,
            phone: data.phone,
            monthly_salary: data.monthly_salary,
            status: data.status,
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.logistics_employees.id, id)).returning();
        return updated[0];
    }
    static async deleteEmployee(id, version) {
        const existing = (await database_1.db.select().from(schema_1.logistics_employees).where((0, drizzle_orm_1.eq)(schema_1.logistics_employees.id, id)).limit(1))[0];
        if (!existing)
            throw new Error('404: Employee not found');
        if (existing.version !== version)
            throw new Error('409: Conflict');
        await database_1.db.update(schema_1.logistics_employees).set({
            deleted_at: new Date(),
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.logistics_employees.id, id));
    }
    // ----------------------------------------------------
    // EXPENSES
    // ----------------------------------------------------
    static async getAllExpenses() {
        return await database_1.db.select().from(schema_1.logistics_expenses).where((0, drizzle_orm_1.sql) `${schema_1.logistics_expenses.deleted_at} IS NULL`).orderBy((0, drizzle_orm_1.sql) `${schema_1.logistics_expenses.date} DESC`);
    }
    static async getExpenseById(id) {
        return (await database_1.db.select().from(schema_1.logistics_expenses).where((0, drizzle_orm_1.eq)(schema_1.logistics_expenses.id, id)).limit(1))[0];
    }
    static async createExpense(data) {
        const inserted = await database_1.db.insert(schema_1.logistics_expenses).values({
            id: (0, crypto_1.randomUUID)(),
            vehicle_id: data.vehicle_id,
            date: data.date,
            amount: data.amount,
            type: data.type,
            category: data.category,
            description: data.description,
            version: 1,
            created_at: new Date(),
            updated_at: new Date()
        }).returning();
        return inserted[0];
    }
    static async updateExpense(id, data, version) {
        const existing = (await database_1.db.select().from(schema_1.logistics_expenses).where((0, drizzle_orm_1.eq)(schema_1.logistics_expenses.id, id)).limit(1))[0];
        if (!existing)
            throw new Error('404: Expense not found');
        if (existing.version !== version)
            throw new Error('409: Conflict');
        const updated = await database_1.db.update(schema_1.logistics_expenses).set({
            vehicle_id: data.vehicle_id,
            date: data.date,
            amount: data.amount,
            type: data.type,
            category: data.category,
            description: data.description,
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.logistics_expenses.id, id)).returning();
        return updated[0];
    }
    static async deleteExpense(id, version) {
        const existing = (await database_1.db.select().from(schema_1.logistics_expenses).where((0, drizzle_orm_1.eq)(schema_1.logistics_expenses.id, id)).limit(1))[0];
        if (!existing)
            throw new Error('404: Expense not found');
        if (existing.version !== version)
            throw new Error('409: Conflict');
        await database_1.db.update(schema_1.logistics_expenses).set({
            deleted_at: new Date(),
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.logistics_expenses.id, id));
    }
    // ----------------------------------------------------
    // BUCKET RENTALS
    // ----------------------------------------------------
    static async getAllBucketRentals() {
        return await database_1.db.select().from(schema_1.logistics_bucket_rentals).where((0, drizzle_orm_1.sql) `${schema_1.logistics_bucket_rentals.deleted_at} IS NULL`).orderBy((0, drizzle_orm_1.sql) `${schema_1.logistics_bucket_rentals.date} DESC`);
    }
    static async getBucketRentalById(id) {
        return (await database_1.db.select().from(schema_1.logistics_bucket_rentals).where((0, drizzle_orm_1.eq)(schema_1.logistics_bucket_rentals.id, id)).limit(1))[0];
    }
    static async createBucketRental(data) {
        const inserted = await database_1.db.insert(schema_1.logistics_bucket_rentals).values({
            id: (0, crypto_1.randomUUID)(),
            date: data.date,
            time: data.time,
            customer_name: data.customer_name,
            customer_id: data.customer_id || null,
            vehicle_number: data.vehicle_number || null,
            vehicle_id: data.vehicle_id || null,
            material_type: data.material_type,
            quantity_ft: data.quantity_ft,
            price_per_ft: data.price_per_ft,
            total_price: data.total_price,
            status: data.status || 'Unpaid',
            version: 1,
            created_at: new Date(),
            updated_at: new Date()
        }).returning();
        return inserted[0];
    }
    static async updateBucketRental(id, data, version) {
        const existing = (await database_1.db.select().from(schema_1.logistics_bucket_rentals).where((0, drizzle_orm_1.eq)(schema_1.logistics_bucket_rentals.id, id)).limit(1))[0];
        if (!existing)
            throw new Error('404: Bucket rental not found');
        if (existing.version !== version)
            throw new Error('409: Conflict');
        const updated = await database_1.db.update(schema_1.logistics_bucket_rentals).set({
            date: data.date,
            time: data.time,
            customer_name: data.customer_name,
            customer_id: data.customer_id || null,
            vehicle_number: data.vehicle_number || null,
            vehicle_id: data.vehicle_id || null,
            material_type: data.material_type,
            quantity_ft: data.quantity_ft,
            price_per_ft: data.price_per_ft,
            total_price: data.total_price,
            status: data.status,
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.logistics_bucket_rentals.id, id)).returning();
        return updated[0];
    }
    static async deleteBucketRental(id, version) {
        const existing = (await database_1.db.select().from(schema_1.logistics_bucket_rentals).where((0, drizzle_orm_1.eq)(schema_1.logistics_bucket_rentals.id, id)).limit(1))[0];
        if (!existing)
            throw new Error('404: Bucket rental not found');
        if (existing.version !== version)
            throw new Error('409: Conflict');
        await database_1.db.update(schema_1.logistics_bucket_rentals).set({
            deleted_at: new Date(),
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.logistics_bucket_rentals.id, id));
    }
    // ----------------------------------------------------
    // VEHICLE PROFITS AGGREGATION
    // ----------------------------------------------------
    static async getVehicleProfits() {
        const vehicles = await this.getAllVehicles();
        const expenses = await database_1.db.select().from(schema_1.logistics_expenses).where((0, drizzle_orm_1.sql) `${schema_1.logistics_expenses.deleted_at} IS NULL`);
        const rentals = await database_1.db.select().from(schema_1.logistics_bucket_rentals).where((0, drizzle_orm_1.sql) `${schema_1.logistics_bucket_rentals.deleted_at} IS NULL`);
        return vehicles.map((v) => {
            let total_income = 0;
            let total_expense = 0;
            // Income from expenses logged as 'income' (if any manual income entered)
            expenses.filter((e) => e.vehicle_id === v.id && e.type === 'income').forEach((e) => total_income += e.amount);
            // Income from bucket rentals (paid or unpaid, depending on accounting rule, but let's count total_price)
            rentals.filter((r) => r.vehicle_id === v.id).forEach((r) => total_income += r.total_price);
            // Expenses
            expenses.filter((e) => e.vehicle_id === v.id && e.type === 'expense').forEach((e) => total_expense += e.amount);
            return {
                ...v,
                total_income,
                total_expense,
                net_profit: total_income - total_expense
            };
        });
    }
    // ----------------------------------------------------
    // OUTSIDE LOADER FEES
    // ----------------------------------------------------
    static async getOutsideLoaderFees() {
        const rawInvoices = await database_1.db
            .select({
            id: schema_1.invoices.id,
            invoice_number: schema_1.invoices.invoice_number,
            date: schema_1.invoices.date,
            outside_loader_fee: schema_1.invoices.outside_loader_fee
        })
            .from(schema_1.invoices)
            .where((0, drizzle_orm_1.sql) `${schema_1.invoices.outside_loader_fee} > 0`);
        return rawInvoices.map((inv) => ({
            id: `loader-${inv.id}`,
            vehicle_id: null,
            invoice_id: inv.id,
            date: inv.date,
            amount: inv.outside_loader_fee,
            type: 'expense',
            category: 'Outside Loader',
            description: `Outside Loader Fee for Invoice ${inv.invoice_number}`,
            version: 1,
            created_at: new Date(),
            updated_at: new Date()
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
}
exports.LogisticsService = LogisticsService;
