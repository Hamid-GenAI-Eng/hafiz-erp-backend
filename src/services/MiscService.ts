import { db } from '../config/database';
import { misc_expenses } from '../models/schema';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class MiscService {
  static async getAllExpenses() {
    return await db.select().from(misc_expenses).where(sql`${misc_expenses.deleted_at} IS NULL`).orderBy(sql`${misc_expenses.date} DESC`);
  }

  static async getExpenseById(id: string) {
    return (await db.select().from(misc_expenses).where(eq(misc_expenses.id, id)).limit(1))[0];
  }

  static async createExpense(data: any) {
    const inserted = await db.insert(misc_expenses).values({
      id: randomUUID(),
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

  static async updateExpense(id: string, data: any, version: number) {
    const existing = await this.getExpenseById(id);
    if (!existing) throw new Error('404: Expense not found');
    if (existing.version !== version) throw new Error('409: Conflict');

    const updated = await db.update(misc_expenses).set({
      date: data.date,
      time: data.time,
      category: data.category,
      amount: data.amount,
      description: data.description,
      type: data.type || existing.type,
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(misc_expenses.id, id)).returning();
    return updated[0];
  }

  static async deleteExpense(id: string, version: number) {
    const existing = await this.getExpenseById(id);
    if (!existing) throw new Error('404: Expense not found');
    if (existing.version !== version) throw new Error('409: Conflict');

    await db.update(misc_expenses)
      .set({ deleted_at: new Date(), updated_at: new Date(), version: existing.version + 1 })
      .where(eq(misc_expenses.id, id));
    return true;
  }
}
