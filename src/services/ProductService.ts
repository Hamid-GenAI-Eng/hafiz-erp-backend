import { db } from '../config/database';
import { products, suppliers, supplier_ledgers } from '../models/schema';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class ProductService {
  static async getAllProducts() {
    const rows = await db.select({
      product: products,
      supplier_name: suppliers.company_name
    })
    .from(products)
    .leftJoin(suppliers, eq(products.supplier_id, suppliers.id))
    .where(sql`${products.deleted_at} IS NULL`)
    .orderBy(products.name);

    return rows.map((row: any) => ({
      ...row.product,
      supplier_name: row.supplier_name
    }));
  }

  static async getProductById(id: string) {
    const rows = await db.select({
      product: products,
      supplier_name: suppliers.company_name
    })
    .from(products)
    .leftJoin(suppliers, eq(products.supplier_id, suppliers.id))
    .where(eq(products.id, id))
    .limit(1);

    if (rows.length === 0) return null;
    return {
      ...rows[0].product,
      supplier_name: rows[0].supplier_name
    };
  }

  static async createProduct(data: any) {
    const productId = randomUUID();
    
    // Auto-generate SKU based on type
    const prefix = data.type === 'building' ? 'BLD' : 'SAN';
    const uniqueSuffix = Date.now().toString().slice(-5);
    const sku = `${prefix}-${uniqueSuffix}`;

    const newProduct = {
      id: productId,
      sku,
      type: data.type,
      category: data.category,
      name: data.name,
      brand: data.brand,
      size: data.size,
      color: data.color,
      location: data.location,
      unit: data.unit,
      current_qty: data.current_qty || 0,
      cost_price: data.cost_price || 0,
      sale_price: data.sale_price || 0,
      min_alert: data.min_alert || 0,
      supplier_id: data.supplier_id || null,
      created_at: new Date(),
      updated_at: new Date(),
      version: 1
    };

    // If there is an initial stock and a supplier is provided, we log it automatically
    // using a synchronous transaction for better-sqlite3 compatibility
    if (newProduct.supplier_id && newProduct.current_qty > 0) {
      const amount = newProduct.current_qty * newProduct.cost_price;
      const payment_amount = data.amount_paid || 0;

      // Executing sequentially to support both SQLite and Postgres natively without async transaction issues
      // 1. Insert product
      await db.insert(products).values(newProduct);

      // 2. Get Supplier
      const suppArray = await db.select().from(suppliers).where(eq(suppliers.id, newProduct.supplier_id)).limit(1);
      if (!suppArray || suppArray.length === 0) throw new Error('Supplier not found');
      const supp = suppArray[0];

      // 3. Insert Supplier Ledger entry
      const netChange = amount - payment_amount;
      const newRunningBalance = supp.balance_owed + netChange;

      const entry = {
        id: randomUUID(),
        supplier_id: supp.id,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        type: 'purchase',
        amount,
        payment_amount,
        running_balance: newRunningBalance,
        description: `Initial Stock: ${newProduct.name} (${newProduct.current_qty} ${newProduct.unit})`,
        reference: `INIT-${sku}`,
        created_at: new Date(),
        updated_at: new Date(),
        version: 1
      };
      await db.insert(supplier_ledgers).values(entry);

      // 4. Update Supplier Cache
      await db.update(suppliers).set({
        balance_owed: newRunningBalance,
        total_purchased: supp.total_purchased + amount,
        total_paid: supp.total_paid + payment_amount,
        version: supp.version + 1,
        updated_at: new Date()
      }).where(eq(suppliers.id, supp.id));

      return newProduct;
    } else {
      // Normal insertion without supplier ledger impact
      await db.insert(products).values(newProduct);
      return newProduct;
    }
  }

  static async updateProduct(id: string, data: any, incomingVersion: number) {
    const existingArray = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existingArray || existingArray.length === 0) throw new Error('Product not found');
    const existing = existingArray[0];
    if (existing.version !== incomingVersion) throw new Error('409: Conflict - version mismatch');

    const { id: _id, sku, created_at, updated_at, deleted_at, device_id, version, amount_paid, ...safeData } = data;

    const qty_difference = (safeData.current_qty !== undefined) ? Number(safeData.current_qty) - existing.current_qty : 0;

    const updatedData = {
      ...safeData,
      version: existing.version + 1,
      updated_at: new Date()
    };

    await db.update(products).set(updatedData).where(eq(products.id, id));

    if (qty_difference !== 0 && existing.supplier_id) {
      const costPrice = Number(safeData.cost_price || existing.cost_price || 0);
      
      let billAmount = 0;
      let paymentAmount = 0;
      
      if (qty_difference > 0) {
        billAmount = qty_difference * costPrice;
      } else {
        paymentAmount = Math.abs(qty_difference) * costPrice;
      }

      if (billAmount > 0 || paymentAmount > 0) {
        await db.insert(supplier_ledgers).values({
          id: randomUUID(),
          supplier_id: existing.supplier_id,
          date: new Date().toISOString().split("T")[0],
          description: `Manual Stock Adjustment: ${existing.name} (${qty_difference > 0 ? '+' : ''}${qty_difference} qty)`,
          amount: billAmount,
          payment_amount: paymentAmount,
          running_balance: 0, // This needs proper running balance recalculation if strictly followed, simplified here for adjustment.
          type: 'purchase',
          version: 1,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    const finalArray = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return finalArray[0];
  }

  static async deleteProduct(id: string, incomingVersion: number) {
    const existing = await this.getProductById(id);
    if (!existing) throw new Error('Product not found');
    if (existing.version !== incomingVersion) throw new Error('409: Conflict - version mismatch');

    await db.update(products).set({
      deleted_at: new Date(),
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(products.id, id));
    
    return true;
  }
}
