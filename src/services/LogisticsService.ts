import { db } from '../config/database';
import { logistics_vehicles, logistics_employees, logistics_expenses, logistics_bucket_rentals } from '../models/schema';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class LogisticsService {
  // ----------------------------------------------------
  // VEHICLES
  // ----------------------------------------------------
  static async getAllVehicles() {
    return await db.select().from(logistics_vehicles).where(sql`${logistics_vehicles.deleted_at} IS NULL`);
  }

  static async getVehicleById(id: string) {
    const res = await db.select().from(logistics_vehicles).where(eq(logistics_vehicles.id, id)).limit(1);
    return res[0] || null;
  }

  static async createVehicle(data: any) {
    const inserted = await db.insert(logistics_vehicles).values({
      id: randomUUID(),
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

  static async updateVehicle(id: string, data: any, version: number) {
    const existing = await this.getVehicleById(id);
    if (!existing) throw new Error('404: Vehicle not found');
    if (existing.version !== version) throw new Error('409: Conflict: Vehicle was modified by another device');

    const updated = await db.update(logistics_vehicles).set({
      name: data.name,
      plate_number: data.plate_number,
      ownership: data.ownership,
      status: data.status,
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(logistics_vehicles.id, id)).returning();
    return updated[0];
  }

  static async deleteVehicle(id: string, version: number) {
    const existing = await this.getVehicleById(id);
    if (!existing) throw new Error('404: Vehicle not found');
    if (existing.version !== version) throw new Error('409: Conflict: Vehicle was modified by another device');

    await db.update(logistics_vehicles).set({
      deleted_at: new Date(),
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(logistics_vehicles.id, id));
  }

  // ----------------------------------------------------
  // EMPLOYEES
  // ----------------------------------------------------
  static async getAllEmployees() {
    return await db.select().from(logistics_employees).where(sql`${logistics_employees.deleted_at} IS NULL`);
  }

  static async getEmployeeById(id: string) {
    return (await db.select().from(logistics_employees).where(eq(logistics_employees.id, id)).limit(1))[0];
  }

  static async createEmployee(data: any) {
    const inserted = await db.insert(logistics_employees).values({
      id: randomUUID(),
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

  static async updateEmployee(id: string, data: any, version: number) {
    const existing = (await db.select().from(logistics_employees).where(eq(logistics_employees.id, id)).limit(1))[0];
    if (!existing) throw new Error('404: Employee not found');
    if (existing.version !== version) throw new Error('409: Conflict');

    const updated = await db.update(logistics_employees).set({
      name: data.name,
      role: data.role,
      phone: data.phone,
      monthly_salary: data.monthly_salary,
      status: data.status,
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(logistics_employees.id, id)).returning();
    return updated[0];
  }

  static async deleteEmployee(id: string, version: number) {
    const existing = (await db.select().from(logistics_employees).where(eq(logistics_employees.id, id)).limit(1))[0];
    if (!existing) throw new Error('404: Employee not found');
    if (existing.version !== version) throw new Error('409: Conflict');

    await db.update(logistics_employees).set({
      deleted_at: new Date(),
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(logistics_employees.id, id));
  }

  // ----------------------------------------------------
  // EXPENSES
  // ----------------------------------------------------
  static async getAllExpenses() {
    return await db.select().from(logistics_expenses).where(sql`${logistics_expenses.deleted_at} IS NULL`).orderBy(sql`${logistics_expenses.date} DESC`);
  }

  static async getExpenseById(id: string) {
    return (await db.select().from(logistics_expenses).where(eq(logistics_expenses.id, id)).limit(1))[0];
  }

  static async createExpense(data: any) {
    const inserted = await db.insert(logistics_expenses).values({
      id: randomUUID(),
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

  static async updateExpense(id: string, data: any, version: number) {
    const existing = (await db.select().from(logistics_expenses).where(eq(logistics_expenses.id, id)).limit(1))[0];
    if (!existing) throw new Error('404: Expense not found');
    if (existing.version !== version) throw new Error('409: Conflict');

    const updated = await db.update(logistics_expenses).set({
      vehicle_id: data.vehicle_id,
      date: data.date,
      amount: data.amount,
      type: data.type,
      category: data.category,
      description: data.description,
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(logistics_expenses.id, id)).returning();
    return updated[0];
  }

  static async deleteExpense(id: string, version: number) {
    const existing = (await db.select().from(logistics_expenses).where(eq(logistics_expenses.id, id)).limit(1))[0];
    if (!existing) throw new Error('404: Expense not found');
    if (existing.version !== version) throw new Error('409: Conflict');

    await db.update(logistics_expenses).set({
      deleted_at: new Date(),
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(logistics_expenses.id, id));
  }

  // ----------------------------------------------------
  // BUCKET RENTALS
  // ----------------------------------------------------
  static async getAllBucketRentals() {
    return await db.select().from(logistics_bucket_rentals).where(sql`${logistics_bucket_rentals.deleted_at} IS NULL`).orderBy(sql`${logistics_bucket_rentals.date} DESC`);
  }

  static async getBucketRentalById(id: string) {
    return (await db.select().from(logistics_bucket_rentals).where(eq(logistics_bucket_rentals.id, id)).limit(1))[0];
  }

  static async createBucketRental(data: any) {
    const inserted = await db.insert(logistics_bucket_rentals).values({
      id: randomUUID(),
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

  static async updateBucketRental(id: string, data: any, version: number) {
    const existing = (await db.select().from(logistics_bucket_rentals).where(eq(logistics_bucket_rentals.id, id)).limit(1))[0];
    if (!existing) throw new Error('404: Bucket rental not found');
    if (existing.version !== version) throw new Error('409: Conflict');

    const updated = await db.update(logistics_bucket_rentals).set({
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
    }).where(eq(logistics_bucket_rentals.id, id)).returning();
    return updated[0];
  }

  static async deleteBucketRental(id: string, version: number) {
    const existing = (await db.select().from(logistics_bucket_rentals).where(eq(logistics_bucket_rentals.id, id)).limit(1))[0];
    if (!existing) throw new Error('404: Bucket rental not found');
    if (existing.version !== version) throw new Error('409: Conflict');

    await db.update(logistics_bucket_rentals).set({
      deleted_at: new Date(),
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(logistics_bucket_rentals.id, id));
  }

  // ----------------------------------------------------
  // VEHICLE PROFITS AGGREGATION
  // ----------------------------------------------------
  static async getVehicleProfits() {
    const vehicles = await this.getAllVehicles();
    const expenses = await db.select().from(logistics_expenses).where(sql`${logistics_expenses.deleted_at} IS NULL`);
    const rentals = await db.select().from(logistics_bucket_rentals).where(sql`${logistics_bucket_rentals.deleted_at} IS NULL`);

    return vehicles.map((v: any) => {
      let total_income = 0;
      let total_expense = 0;

      // Income from expenses logged as 'income' (if any manual income entered)
      expenses.filter((e: any) => e.vehicle_id === v.id && e.type === 'income').forEach((e: any) => total_income += e.amount);
      
      // Income from bucket rentals (paid or unpaid, depending on accounting rule, but let's count total_price)
      rentals.filter((r: any) => r.vehicle_id === v.id).forEach((r: any) => total_income += r.total_price);

      // Expenses
      expenses.filter((e: any) => e.vehicle_id === v.id && e.type === 'expense').forEach((e: any) => total_expense += e.amount);

      return {
        ...v,
        total_income,
        total_expense,
        net_profit: total_income - total_expense
      };
    });
  }
}
