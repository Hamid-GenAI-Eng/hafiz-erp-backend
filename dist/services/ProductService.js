"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
class ProductService {
    static async getAllProducts() {
        const rows = await database_1.db.select({
            product: schema_1.products,
            supplier_name: schema_1.suppliers.company_name
        })
            .from(schema_1.products)
            .leftJoin(schema_1.suppliers, (0, drizzle_orm_1.eq)(schema_1.products.supplier_id, schema_1.suppliers.id))
            .where((0, drizzle_orm_1.sql) `${schema_1.products.deleted_at} IS NULL`)
            .orderBy(schema_1.products.name);
        return rows.map((row) => ({
            ...row.product,
            supplier_name: row.supplier_name
        }));
    }
    static async getProductById(id) {
        const rows = await database_1.db.select({
            product: schema_1.products,
            supplier_name: schema_1.suppliers.company_name
        })
            .from(schema_1.products)
            .leftJoin(schema_1.suppliers, (0, drizzle_orm_1.eq)(schema_1.products.supplier_id, schema_1.suppliers.id))
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, id))
            .limit(1);
        if (rows.length === 0)
            return null;
        return {
            ...rows[0].product,
            supplier_name: rows[0].supplier_name
        };
    }
    static async createProduct(data) {
        const productId = (0, crypto_1.randomUUID)();
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
            return database_1.db.transaction((tx) => {
                // 1. Insert product
                tx.insert(schema_1.products).values(newProduct).run();
                // 2. Get Supplier
                const suppArray = tx.select().from(schema_1.suppliers).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, newProduct.supplier_id)).limit(1).all();
                if (!suppArray || suppArray.length === 0)
                    throw new Error('Supplier not found');
                const supp = suppArray[0];
                // 3. Insert Supplier Ledger entry
                const netChange = amount - payment_amount;
                const newRunningBalance = supp.balance_owed + netChange;
                const entry = {
                    id: (0, crypto_1.randomUUID)(),
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
                tx.insert(schema_1.supplier_ledgers).values(entry).run();
                // 4. Update Supplier Cache
                tx.update(schema_1.suppliers).set({
                    balance_owed: newRunningBalance,
                    total_purchased: supp.total_purchased + amount,
                    total_paid: supp.total_paid + payment_amount,
                    version: supp.version + 1,
                    updated_at: new Date()
                }).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, supp.id)).run();
                return newProduct;
            });
        }
        else {
            // Normal insertion without supplier ledger impact
            await database_1.db.insert(schema_1.products).values(newProduct);
            return newProduct;
        }
    }
    static async updateProduct(id, data, incomingVersion) {
        const existing = await this.getProductById(id);
        if (!existing)
            throw new Error('Product not found');
        if (existing.version !== incomingVersion)
            throw new Error('409: Conflict - version mismatch');
        // Strip read-only fields
        const { id: _id, sku, created_at, updated_at, deleted_at, device_id, version, amount_paid, ...safeData } = data;
        const updatedData = {
            ...safeData,
            version: existing.version + 1,
            updated_at: new Date()
        };
        await database_1.db.update(schema_1.products).set(updatedData).where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
        return await this.getProductById(id);
    }
    static async deleteProduct(id, incomingVersion) {
        const existing = await this.getProductById(id);
        if (!existing)
            throw new Error('Product not found');
        if (existing.version !== incomingVersion)
            throw new Error('409: Conflict - version mismatch');
        await database_1.db.update(schema_1.products).set({
            deleted_at: new Date(),
            version: existing.version + 1,
            updated_at: new Date()
        }).where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
        return true;
    }
}
exports.ProductService = ProductService;
