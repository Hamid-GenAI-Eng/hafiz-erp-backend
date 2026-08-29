import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { suppliers, supplier_ledgers } from '../models/schema';

export class SupplierService {
  
  // ----------------------------------------------------
  // Suppliers
  // ----------------------------------------------------

  static async getAllSuppliers() {
    // Only return active suppliers (deleted_at is null)
    const result = await db.select()
      .from(suppliers)
      .where(sql`${suppliers.deleted_at} IS NULL`)
      .orderBy(suppliers.company_name);
    return result;
  }

  static async getSupplierById(id: string) {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    if (!result || result.length === 0) return null;
    return result[0];
  }

  static async createSupplier(data: {
    id: string;
    supplier_number: string;
    company_name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    category?: string;
    tax_id?: string;
    status?: string;
    balance_owed?: number;
  }) {
    const newSupplier = {
      ...data,
      balance_owed: data.balance_owed || 0,
      total_purchased: data.balance_owed && data.balance_owed > 0 ? data.balance_owed : 0, 
      total_paid: data.balance_owed && data.balance_owed < 0 ? Math.abs(data.balance_owed) : 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    await db.insert(suppliers).values(newSupplier);
    return newSupplier;
  }

  static async updateSupplier(id: string, data: any, incomingVersion: number) {
    // OCC Check
    const existing = await this.getSupplierById(id);
    if (!existing) throw new Error('Supplier not found');
    if (existing.version !== incomingVersion) throw new Error('409: Conflict - version mismatch');

    // Strip out read-only fields and metadata to prevent Drizzle errors (e.g. getTime is not a function)
    const { id: _id, supplier_number, created_at, updated_at, deleted_at, balance_owed, total_purchased, total_paid, device_id, version, ...safeData } = data;

    const updatedData = {
      ...safeData,
      version: existing.version + 1,
      updated_at: new Date()
    };

    await db.update(suppliers).set(updatedData).where(eq(suppliers.id, id));
    return await this.getSupplierById(id);
  }

  static async deleteSupplier(id: string, incomingVersion: number) {
    // Soft delete
    const existing = await this.getSupplierById(id);
    if (!existing) throw new Error('Supplier not found');
    if (existing.version !== incomingVersion) throw new Error('409: Conflict - version mismatch');

    await db.update(suppliers).set({
      status: 'inactive',
      deleted_at: new Date(),
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(suppliers.id, id));
    
    return true;
  }

  // ----------------------------------------------------
  // Supplier Ledgers
  // ----------------------------------------------------

  static async getLedgerHistory(supplierId: string) {
    const result = await db.select()
      .from(supplier_ledgers)
      .where(eq(supplier_ledgers.supplier_id, supplierId))
      .orderBy(supplier_ledgers.created_at);
    return result;
  }

  static async createLedgerEntry(data: {
    id: string;
    supplier_id: string;
    date: string;
    time?: string;
    type: string;
    amount: number;
    payment_amount: number;
    description: string;
    method?: string;
    reference?: string;
  }) {
    // Executing sequentially to avoid async transaction conflicts between SQLite and Postgres
    const suppArray = await db.select().from(suppliers).where(eq(suppliers.id, data.supplier_id)).limit(1);
    if (!suppArray || suppArray.length === 0) throw new Error('Supplier not found');
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
    await db.insert(supplier_ledgers).values(entry);

    // 2. Update Supplier Cache
    await db.update(suppliers).set({
      balance_owed: newRunningBalance,
      total_purchased: supp.total_purchased + data.amount,
      total_paid: supp.total_paid + data.payment_amount,
      version: supp.version + 1,
      updated_at: new Date()
    }).where(eq(suppliers.id, data.supplier_id));

    return entry;
  }

  static async updateLedgerEntry(ledgerId: string, incomingVersion: number, data: {
    amount: number;
    payment_amount: number;
    description: string;
    date: string;
    time?: string;
    method?: string;
    reference?: string;
  }) {
    // Executing sequentially to avoid async transaction conflicts between SQLite and Postgres
    // 1. Get existing ledger
    const existingLedgerArray = await db.select().from(supplier_ledgers).where(eq(supplier_ledgers.id, ledgerId)).limit(1);
    if (!existingLedgerArray || existingLedgerArray.length === 0) throw new Error('Ledger entry not found');
    const existingLedger = existingLedgerArray[0];

    // OCC Check
    if (existingLedger.version !== incomingVersion) {
      throw new Error('409: Conflict - version mismatch');
    }

    // 2. Get supplier
    const suppArray = await db.select().from(suppliers).where(eq(suppliers.id, existingLedger.supplier_id)).limit(1);
    if (!suppArray || suppArray.length === 0) throw new Error('Supplier not found');
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
    await db.update(supplier_ledgers).set(updatedLedger).where(eq(supplier_ledgers.id, ledgerId));

    // 5. Update Supplier
    await db.update(suppliers).set({
      balance_owed: newSupplierBalance,
      total_purchased: supp.total_purchased + amountDiff,
      total_paid: supp.total_paid + paymentDiff,
      version: supp.version + 1,
      updated_at: new Date()
    }).where(eq(suppliers.id, supp.id));

    return updatedLedger;
  }
}
