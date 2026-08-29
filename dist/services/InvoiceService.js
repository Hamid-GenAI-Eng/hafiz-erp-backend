"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
const CrmService_1 = require("./CrmService");
class InvoiceService {
    static async getNextInvoiceNumber() {
        const result = await database_1.db
            .select({ invoice_number: schema_1.invoices.invoice_number })
            .from(schema_1.invoices)
            .where((0, drizzle_orm_1.sql) `invoice_number LIKE 'INV-%'`)
            .orderBy((0, drizzle_orm_1.sql) `CAST(SUBSTR(invoice_number, 5) AS INTEGER) DESC`)
            .limit(1);
        if (result.length > 0 && result[0].invoice_number) {
            const lastNum = parseInt(result[0].invoice_number.replace("INV-", ""));
            if (!isNaN(lastNum))
                return `INV-${lastNum + 1}`;
        }
        return "INV-1001";
    }
    static async getAllInvoices() {
        return await database_1.db
            .select()
            .from(schema_1.invoices)
            .where((0, drizzle_orm_1.sql) `${schema_1.invoices.deleted_at} IS NULL`)
            .orderBy((0, drizzle_orm_1.sql) `${schema_1.invoices.date} DESC, ${schema_1.invoices.time} DESC`);
    }
    static async getInvoiceById(id) {
        const invoiceResult = await database_1.db
            .select()
            .from(schema_1.invoices)
            .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id))
            .limit(1);
        if (!invoiceResult || invoiceResult.length === 0)
            return null;
        const items = await database_1.db
            .select()
            .from(schema_1.invoice_items)
            .where((0, drizzle_orm_1.eq)(schema_1.invoice_items.invoice_id, id));
        const logistics = await database_1.db
            .select()
            .from(schema_1.logistics_expenses)
            .where((0, drizzle_orm_1.eq)(schema_1.logistics_expenses.invoice_id, id));
        const loaders = logistics.filter((l) => l.type === 'income').map((l) => ({
            vehicle_id: l.vehicle_id,
            fee: l.amount
        }));
        return {
            ...invoiceResult[0],
            items,
            loaders,
        };
    }
    static async createInvoice(data) {
        try {
            // Determine Invoice Number
            let invoiceNumber = data.invoice_number;
            if (!invoiceNumber || invoiceNumber.startsWith("TMP-")) {
                invoiceNumber = await this.getNextInvoiceNumber();
            }
            const invoiceId = (0, crypto_1.randomUUID)();
            // 1. Insert Invoice
            const newInvoice = {
                id: invoiceId,
                invoice_number: invoiceNumber,
                customer_id: data.customer_id ? String(data.customer_id) : null,
                walkin_name: data.walkin_name,
                walkin_phone: data.walkin_phone,
                date: data.date,
                time: data.time || new Date().toISOString().split("T")[1].slice(0, 5),
                due_date: data.due_date,
                reference: data.reference,
                status: data.status || "active",
                subtotal: data.subtotal || 0,
                total_discount: data.total_discount || 0,
                shipping: data.shipping || 0,
                internal_shipping: data.internal_shipping || 0,
                extra_discount: data.extra_discount || 0,
                outside_loader_fee: data.outside_loader_fee || 0,
                grand_total: data.grand_total || 0,
                amount_paid: data.amount_paid || 0,
                version: 1,
                created_at: new Date(),
                updated_at: new Date(),
            };
            await database_1.db.insert(schema_1.invoices).values(newInvoice);
            // 2. Insert Items and Deduct Stock
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    const itemId = (0, crypto_1.randomUUID)();
                    await database_1.db.insert(schema_1.invoice_items).values({
                        id: itemId,
                        invoice_id: invoiceId,
                        product_id: item.product_id && item.product_id !== "LABOUR"
                            ? String(item.product_id)
                            : null,
                        description: item.description,
                        quantity: item.quantity || 0,
                        unit_price: item.unit_price || 0,
                        discount: item.discount || 0,
                        total_price: item.total_price || 0,
                        version: 1,
                        created_at: new Date(),
                        updated_at: new Date(),
                    });
                    // Deduct stock with concurrency guard (ignore custom items or LABOUR)
                    if (item.product_id &&
                        item.product_id !== "LABOUR" &&
                        item.quantity > 0) {
                        const prodId = String(item.product_id);
                        const updateResult = await database_1.db.execute((0, drizzle_orm_1.sql) `UPDATE products SET current_qty = current_qty - ${item.quantity}, updated_at = ${new Date().toISOString()} WHERE id = ${prodId} AND current_qty >= ${item.quantity}`);
                        const rowsAffected = updateResult.changes !== undefined ? updateResult.changes : (updateResult.rowCount || updateResult.length || 0);
                        if (rowsAffected === 0) {
                            throw new Error(`Insufficient stock for product ID ${prodId}`);
                        }
                    }
                }
            }
            // 3. Update Ledger (CRM)
            if (newInvoice.customer_id && newInvoice.status !== "Draft") {
                if (newInvoice.grand_total > 0 || newInvoice.amount_paid > 0) {
                    await CrmService_1.CrmService.createLedgerEntry({
                        id: (0, crypto_1.randomUUID)(),
                        customer_id: newInvoice.customer_id,
                        invoice_id: invoiceId,
                        date: newInvoice.date,
                        time: newInvoice.time,
                        type: "charge",
                        amount: newInvoice.grand_total,
                        payment_amount: newInvoice.amount_paid,
                        description: `Invoice ${invoiceNumber}`,
                        reference: newInvoice.reference || "",
                    });
                }
            }
            // 4. Logistics Income
            if (data.loaders &&
                data.loaders.length > 0 &&
                newInvoice.status !== "Draft") {
                for (const loader of data.loaders) {
                    if (loader.vehicle_id && loader.fee > 0) {
                        await database_1.db.insert(schema_1.logistics_expenses).values({
                            id: (0, crypto_1.randomUUID)(),
                            vehicle_id: String(loader.vehicle_id),
                            invoice_id: invoiceId,
                            date: newInvoice.date,
                            time: newInvoice.time,
                            type: "income",
                            amount: loader.fee,
                            category: "Shipping",
                            description: `Delivery for Invoice ${invoiceNumber}`,
                            version: 1,
                            created_at: new Date(),
                            updated_at: new Date(),
                        });
                    }
                }
            }
            return await this.getInvoiceById(invoiceId);
        }
        catch (err) {
            throw err;
        }
    }
    static async reverseInvoiceEffects(invoice, isDelete = false, isEdit = false) {
        const invoiceId = invoice.id;
        // 1. Add Stock Back
        for (const item of invoice.items) {
            if (item.product_id &&
                item.product_id !== "LABOUR" &&
                item.quantity > 0) {
                await database_1.db.execute((0, drizzle_orm_1.sql) `UPDATE products SET current_qty = current_qty + ${item.quantity}, updated_at = ${new Date().toISOString()} WHERE id = ${item.product_id}`);
            }
        }
        // 2. Reverse CRM Ledger (Skip if this is just an edit, we will update it directly)
        if (invoice.customer_id && invoice.status !== "Draft" && !isEdit) {
            if (invoice.grand_total > 0 || invoice.amount_paid > 0) {
                await CrmService_1.CrmService.createLedgerEntry({
                    id: (0, crypto_1.randomUUID)(),
                    customer_id: invoice.customer_id,
                    date: new Date().toISOString().split("T")[0],
                    time: new Date().toISOString().split("T")[1].slice(0, 5),
                    type: "reversal",
                    amount: invoice.amount_paid, // Reversing the payment (becomes a charge to correct it)
                    payment_amount: invoice.grand_total, // Reversing the charge (becomes a payment to correct it)
                    description: `Reversal for Cancelled Invoice ${invoice.invoice_number}`,
                    reference: invoice.reference || "",
                    invoice_id: invoiceId,
                });
            }
        }
        // 3. Reverse Logistics Income (Only when deleting/cancelling, not editing)
        if (invoice.status !== "Draft" && isDelete) {
            const logisticsIncomes = await database_1.db
                .select()
                .from(schema_1.logistics_expenses)
                .where((0, drizzle_orm_1.eq)(schema_1.logistics_expenses.invoice_id, invoiceId));
            for (const income of logisticsIncomes) {
                // Insert offsetting expense instead of soft-delete to maintain audit trail
                await database_1.db.insert(schema_1.logistics_expenses).values({
                    id: (0, crypto_1.randomUUID)(),
                    vehicle_id: income.vehicle_id,
                    invoice_id: invoiceId, // Linking reversal to the same invoice
                    date: new Date().toISOString().split("T")[0],
                    time: new Date().toISOString().split("T")[1].slice(0, 5),
                    type: "expense", // Offsetting expense
                    amount: income.amount,
                    category: "Shipping Reversal",
                    description: `Reversal of Delivery Income for Cancelled Invoice ${invoice.invoice_number}`,
                    version: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }
        }
    }
    static async deleteInvoice(id) {
        try {
            const invoice = await this.getInvoiceById(id);
            if (!invoice)
                throw new Error("Invoice not found");
            if (invoice.status === "cancelled")
                throw new Error("Invoice is already cancelled");
            // Reverse effects
            await this.reverseInvoiceEffects(invoice, true);
            // Soft delete invoice
            await database_1.db
                .update(schema_1.invoices)
                .set({
                status: "cancelled",
                deleted_at: new Date(),
                version: invoice.version + 1,
                updated_at: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id));
            // Soft delete items
            await database_1.db
                .update(schema_1.invoice_items)
                .set({
                deleted_at: new Date(),
                updated_at: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.invoice_items.invoice_id, id));
            return true;
        }
        catch (err) {
            throw err;
        }
    }
    static async updateInvoice(id, data) {
        try {
            const existing = await this.getInvoiceById(id);
            if (!existing)
                throw new Error("Invoice not found");
            if (existing.status === "cancelled")
                throw new Error("Cannot edit a cancelled invoice");
            // First, reverse the effects of the old invoice (pass isEdit = true to skip Ledger reversal)
            await this.reverseInvoiceEffects(existing, false, true);
            // Physically delete old invoice items and logistics expenses to insert new ones
            await database_1.db.delete(schema_1.invoice_items).where((0, drizzle_orm_1.eq)(schema_1.invoice_items.invoice_id, id));
            await database_1.db.delete(schema_1.logistics_expenses).where((0, drizzle_orm_1.eq)(schema_1.logistics_expenses.invoice_id, id));
            // Update main invoice
            await database_1.db
                .update(schema_1.invoices)
                .set({
                customer_id: data.customer_id ? String(data.customer_id) : null,
                walkin_name: data.walkin_name,
                walkin_phone: data.walkin_phone,
                date: data.date,
                time: data.time,
                due_date: data.due_date,
                reference: data.reference,
                status: data.status || "active",
                subtotal: data.subtotal || 0,
                total_discount: data.total_discount || 0,
                shipping: data.shipping || 0,
                internal_shipping: data.internal_shipping || 0,
                extra_discount: data.extra_discount || 0,
                outside_loader_fee: data.outside_loader_fee || 0,
                grand_total: data.grand_total || 0,
                amount_paid: data.amount_paid || 0,
                version: existing.version + 1,
                updated_at: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.invoices.id, id));
            const updatedInvoice = await this.getInvoiceById(id);
            // 2. Insert Items and Deduct Stock again
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    const itemId = (0, crypto_1.randomUUID)();
                    await database_1.db.insert(schema_1.invoice_items).values({
                        id: itemId,
                        invoice_id: id,
                        product_id: item.product_id && item.product_id !== "LABOUR"
                            ? String(item.product_id)
                            : null,
                        description: item.description,
                        quantity: item.quantity || 0,
                        unit_price: item.unit_price || 0,
                        discount: item.discount || 0,
                        total_price: item.total_price || 0,
                        version: 1,
                        created_at: new Date(),
                        updated_at: new Date(),
                    });
                    // Deduct stock with concurrency guard (ignore custom items or LABOUR)
                    if (item.product_id &&
                        item.product_id !== "LABOUR" &&
                        item.quantity > 0) {
                        const prodId = String(item.product_id);
                        const updateResult = await database_1.db.execute((0, drizzle_orm_1.sql) `UPDATE products SET current_qty = current_qty - ${item.quantity}, updated_at = ${new Date().toISOString()} WHERE id = ${prodId} AND current_qty >= ${item.quantity}`);
                        const rowsAffected = updateResult.changes !== undefined ? updateResult.changes : (updateResult.rowCount || updateResult.length || 0);
                        if (rowsAffected === 0) {
                            throw new Error(`Insufficient stock for product ID ${prodId}`);
                        }
                    }
                }
            }
            // 3. Update Ledger (CRM)
            if (updatedInvoice.customer_id && updatedInvoice.status !== "Draft") {
                if (updatedInvoice.grand_total > 0 ||
                    updatedInvoice.amount_paid > 0) {
                    // Find the existing ledger entry linked to this invoice
                    const existingLedgerArray = await database_1.db.select().from(schema_1.ledgers)
                        .where((0, drizzle_orm_1.eq)(schema_1.ledgers.invoice_id, id))
                        .limit(1);
                    if (existingLedgerArray && existingLedgerArray.length > 0) {
                        const existingLedger = existingLedgerArray[0];
                        await CrmService_1.CrmService.updateLedgerEntry(existingLedger.id, existingLedger.version, {
                            amount: updatedInvoice.grand_total,
                            payment_amount: updatedInvoice.amount_paid,
                            description: `Invoice ${existing.invoice_number}`,
                            date: updatedInvoice.date,
                            time: updatedInvoice.time,
                            reference: updatedInvoice.reference || "",
                            invoice_id: id
                        });
                    }
                    else {
                        // If for some reason it didn't have an existing ledger, create one
                        await CrmService_1.CrmService.createLedgerEntry({
                            id: (0, crypto_1.randomUUID)(),
                            customer_id: updatedInvoice.customer_id,
                            invoice_id: id,
                            date: updatedInvoice.date,
                            time: updatedInvoice.time,
                            type: "charge",
                            amount: updatedInvoice.grand_total,
                            payment_amount: updatedInvoice.amount_paid,
                            description: `Invoice ${existing.invoice_number}`,
                            reference: updatedInvoice.reference || "",
                        });
                    }
                }
            }
            // 4. Logistics Income
            if (data.loaders &&
                data.loaders.length > 0 &&
                updatedInvoice.status !== "Draft") {
                for (const loader of data.loaders) {
                    if (loader.vehicle_id && loader.fee > 0) {
                        await database_1.db.insert(schema_1.logistics_expenses).values({
                            id: (0, crypto_1.randomUUID)(),
                            vehicle_id: String(loader.vehicle_id),
                            invoice_id: id,
                            date: updatedInvoice.date,
                            time: updatedInvoice.time,
                            type: "income",
                            amount: loader.fee,
                            category: "Shipping",
                            description: `Delivery for Invoice ${existing.invoice_number} (Edited)`,
                            version: 1,
                            created_at: new Date(),
                            updated_at: new Date(),
                        });
                    }
                }
            }
            return await this.getInvoiceById(id);
        }
        catch (err) {
            throw err;
        }
    }
}
exports.InvoiceService = InvoiceService;
