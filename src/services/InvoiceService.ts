import { getDb } from "../config/database";
import {
  invoices,
  invoice_items,
  products,
  logistics_expenses,
  ledgers
} from "../models/schema";
import { eq, sql, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { CrmService } from "./CrmService";

export class InvoiceService {
  static async getNextInvoiceNumber() {
    const result = await getDb()
      .select({ invoice_number: invoices.invoice_number })
      .from(invoices)
      .where(sql`invoice_number LIKE 'INV-%'`)
      .orderBy(sql`CAST(SUBSTR(invoice_number, 5) AS INTEGER) DESC`)
      .limit(1);

    if (result.length > 0 && result[0].invoice_number) {
      const lastNum = parseInt(result[0].invoice_number.replace("INV-", ""));
      if (!isNaN(lastNum)) return `INV-${lastNum + 1}`;
    }
    return "INV-1001";
  }

  static async getAllInvoices() {
    return await getDb()
      .select()
      .from(invoices)
      .where(sql`${invoices.deleted_at} IS NULL`)
      .orderBy(sql`${invoices.date} DESC, ${invoices.time} DESC`);
  }

  static async getInvoiceById(id: string) {
    const invoiceResult = await getDb()
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);
    if (!invoiceResult || invoiceResult.length === 0) return null;

    const items = await getDb()
      .select()
      .from(invoice_items)
      .where(eq(invoice_items.invoice_id, id));

    const logistics = await getDb()
      .select()
      .from(logistics_expenses)
      .where(eq(logistics_expenses.invoice_id, id));

    const loaders = logistics.filter((l: any) => l.type === 'income').map((l: any) => ({
      vehicle_id: l.vehicle_id,
      fee: l.amount
    }));

    return {
      ...invoiceResult[0],
      items,
      loaders,
    };
  }

  static async createInvoice(data: any) {
    try {
      // 0. Pre-validate Stock to prevent partial failures
      if (data.items && data.items.length > 0) {
        const requiredStock = new Map<string, number>();
        for (const item of data.items) {
          if (item.product_id && item.product_id !== "LABOUR" && item.quantity > 0) {
            const prodId = String(item.product_id);
            requiredStock.set(prodId, (requiredStock.get(prodId) || 0) + item.quantity);
          }
        }
        for (const [prodId, qty] of requiredStock.entries()) {
          const prodResult = await getDb().select().from(products).where(eq(products.id, prodId)).limit(1);
          if (!prodResult || prodResult.length === 0) throw new Error(`Product not found: ${prodId}`);
          if (prodResult[0].current_qty < qty) {
            throw new Error(`Insufficient stock for product ID ${prodId}`);
          }
        }
      }

      // Determine Invoice Number
      let invoiceNumber = data.invoice_number;
      if (!invoiceNumber || invoiceNumber.startsWith("TMP-")) {
        invoiceNumber = await this.getNextInvoiceNumber();
      }

      const invoiceId = randomUUID();

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

      await getDb().insert(invoices).values(newInvoice);

      // 2. Insert Items and Deduct Stock
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const itemId = randomUUID();
          await getDb().insert(invoice_items).values({
            id: itemId,
            invoice_id: invoiceId,
            product_id:
              item.product_id && item.product_id !== "LABOUR"
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

          // Deduct stock (we already verified it will succeed)
          if (
            item.product_id &&
            item.product_id !== "LABOUR" &&
            item.quantity > 0
          ) {
            const prodId = String(item.product_id);
            await getDb().update(products).set({ current_qty: sql`current_qty - ${item.quantity}`, updated_at: new Date() }).where(eq(products.id, prodId));
          }
        }
      }

      // 3. Update Ledger (CRM)
      if (newInvoice.customer_id && newInvoice.status !== "Draft") {
        if (newInvoice.grand_total > 0 || newInvoice.amount_paid > 0) {
          await CrmService.createLedgerEntry({
              id: randomUUID(),
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
      if (
        data.loaders &&
        data.loaders.length > 0 &&
        newInvoice.status !== "Draft"
      ) {
        for (const loader of data.loaders) {
          if (loader.vehicle_id && loader.fee > 0) {
            await getDb().insert(logistics_expenses).values({
              id: randomUUID(),
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
    } catch (err) {
      throw err;
    }
  }

  static async reverseInvoiceEffects(invoice: any, isDelete: boolean = false, isEdit: boolean = false) {
    const invoiceId = invoice.id;

    // 1. Add Stock Back
    for (const item of invoice.items) {
      if (
        item.product_id &&
        item.product_id !== "LABOUR" &&
        item.quantity > 0
      ) {
        await getDb().update(products).set({ current_qty: sql`current_qty + ${item.quantity}`, updated_at: new Date() }).where(eq(products.id, item.product_id));
      }
    }

    // 2. Reverse CRM Ledger (Skip if this is just an edit, we will update it directly)
    if (invoice.customer_id && invoice.status !== "Draft" && !isEdit) {
      if (invoice.grand_total > 0 || invoice.amount_paid > 0) {
        await CrmService.createLedgerEntry({
          id: randomUUID(),
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
      const logisticsIncomes = await getDb()
        .select()
        .from(logistics_expenses)
        .where(eq(logistics_expenses.invoice_id, invoiceId));
      for (const income of logisticsIncomes) {
        // Insert offsetting expense instead of soft-delete to maintain audit trail
        await getDb().insert(logistics_expenses).values({
          id: randomUUID(),
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

  static async deleteInvoice(id: string) {
    try {
      const invoice = await this.getInvoiceById(id);
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === "cancelled")
        throw new Error("Invoice is already cancelled");

      // Reverse effects
      await this.reverseInvoiceEffects(invoice, true);

      // Soft delete invoice
      await getDb()
        .update(invoices)
        .set({
          status: "cancelled",
          deleted_at: new Date(),
          version: invoice.version + 1,
          updated_at: new Date(),
        })
        .where(eq(invoices.id, id));

      // Soft delete items
      await getDb()
        .update(invoice_items)
        .set({
          deleted_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(invoice_items.invoice_id, id));

      return true;
    } catch (err) {
      throw err;
    }
  }

  static async updateInvoice(id: string, data: any) {
    try {
      const existing = await this.getInvoiceById(id);
      if (!existing) throw new Error("Invoice not found");
      if (existing.status === "cancelled")
        throw new Error("Cannot edit a cancelled invoice");

      // 0. Pre-validate Stock to prevent partial failures
      if (data.items && data.items.length > 0) {
        const stockDiffs = new Map<string, number>();
        
        // Add back old stock virtually
        if (existing.items && existing.items.length > 0) {
          for (const oldItem of existing.items) {
            if (oldItem.product_id && oldItem.product_id !== "LABOUR" && oldItem.quantity > 0) {
              const prodId = String(oldItem.product_id);
              stockDiffs.set(prodId, (stockDiffs.get(prodId) || 0) + oldItem.quantity);
            }
          }
        }
        
        // Subtract new stock virtually
        for (const newItem of data.items) {
          if (newItem.product_id && newItem.product_id !== "LABOUR" && newItem.quantity > 0) {
            const prodId = String(newItem.product_id);
            stockDiffs.set(prodId, (stockDiffs.get(prodId) || 0) - newItem.quantity);
          }
        }
        
        // Check if any product needs more stock than what's available
        for (const [prodId, diff] of stockDiffs.entries()) {
          if (diff < 0) {
            const requiredExtra = Math.abs(diff);
            const prodResult = await getDb().select().from(products).where(eq(products.id, prodId)).limit(1);
            if (!prodResult || prodResult.length === 0) throw new Error(`Product not found: ${prodId}`);
            if (prodResult[0].current_qty < requiredExtra) {
              throw new Error(`Insufficient stock for product ID ${prodId}`);
            }
          }
        }
      }

      // First, reverse the effects of the old invoice (pass isEdit = true to skip Ledger reversal)
      await this.reverseInvoiceEffects(existing, false, true);

      // Physically delete old invoice items and logistics expenses to insert new ones
      await getDb().delete(invoice_items).where(eq(invoice_items.invoice_id, id));
      await getDb().delete(logistics_expenses).where(eq(logistics_expenses.invoice_id, id));

      // Update main invoice
      await getDb()
        .update(invoices)
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
        .where(eq(invoices.id, id));

      const updatedInvoice = await this.getInvoiceById(id);

      // 2. Insert Items and Deduct Stock again
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const itemId = randomUUID();
          await getDb().insert(invoice_items).values({
            id: itemId,
            invoice_id: id,
            product_id:
              item.product_id && item.product_id !== "LABOUR"
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

          // Deduct stock (we already verified it will succeed)
          if (
            item.product_id &&
            item.product_id !== "LABOUR" &&
            item.quantity > 0
          ) {
            const prodId = String(item.product_id);
            await getDb().update(products).set({ current_qty: sql`current_qty - ${item.quantity}`, updated_at: new Date() }).where(eq(products.id, prodId));
          }
        }
      }

      // 3. Update Ledger (CRM)
      if (updatedInvoice!.customer_id && updatedInvoice!.status !== "Draft") {
        if (
          updatedInvoice!.grand_total > 0 ||
          updatedInvoice!.amount_paid > 0
        ) {
          // Find the existing ledger entry linked to this invoice
          const existingLedgerArray = await getDb().select().from(ledgers)
            .where(eq(ledgers.invoice_id, id))
            .limit(1);
            
          if (existingLedgerArray && existingLedgerArray.length > 0) {
            const existingLedger = existingLedgerArray[0];
            await CrmService.updateLedgerEntry(existingLedger.id, existingLedger.version, {
               amount: updatedInvoice!.grand_total,
               payment_amount: updatedInvoice!.amount_paid,
               description: `Invoice ${existing.invoice_number}`,
               date: updatedInvoice!.date,
               time: updatedInvoice!.time,
               reference: updatedInvoice!.reference || "",
               invoice_id: id
            });
          } else {
             // If for some reason it didn't have an existing ledger, create one
             await CrmService.createLedgerEntry({
                id: randomUUID(),
                customer_id: updatedInvoice!.customer_id!,
                invoice_id: id,
                date: updatedInvoice!.date,
                time: updatedInvoice!.time,
                type: "charge",
                amount: updatedInvoice!.grand_total,
                payment_amount: updatedInvoice!.amount_paid,
                description: `Invoice ${existing.invoice_number}`,
                reference: updatedInvoice!.reference || "",
              });
          }
        }
      }

      // 4. Logistics Income
      if (
        data.loaders &&
        data.loaders.length > 0 &&
        updatedInvoice!.status !== "Draft"
      ) {
        for (const loader of data.loaders) {
          if (loader.vehicle_id && loader.fee > 0) {
            await getDb().insert(logistics_expenses).values({
              id: randomUUID(),
              vehicle_id: String(loader.vehicle_id),
              invoice_id: id,
              date: updatedInvoice!.date,
              time: updatedInvoice!.time,
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
    } catch (err) {
      throw err;
    }
  }
}
