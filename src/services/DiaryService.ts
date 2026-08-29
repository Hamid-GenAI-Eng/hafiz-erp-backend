import { eq, desc, sql } from "drizzle-orm";
import { db } from "../config/database";
import { diary, diary_items, products, logistics_expenses, ledgers, customers, invoices, invoice_items } from "../models/schema";
import { randomUUID } from "crypto";

export class DiaryService {
  static async getAll() {
    const entries = await db.select().from(diary).where(sql`deleted_at IS NULL`).orderBy(desc(diary.created_at));
    
    const result = [];
    for (const entry of entries) {
      const items = await db.select().from(diary_items).where(eq(diary_items.diary_id, entry.id));
      const logistics = await db.select().from(logistics_expenses).where(eq(logistics_expenses.invoice_id, entry.id));
      
      const materialDetails = {
        linked_note_id: entry.linked_note_id,
        linked_note: entry.linked_note,
        items: items,
        payments: JSON.parse(entry.payments || '[]'),
        shipping: entry.shipping,
        internal_shipping: entry.internal_shipping,
        loaders: logistics
      };

      result.push({
        ...entry,
        material_details: JSON.stringify(materialDetails)
      });
    }
    return result;
  }

  static async getById(id: string) {
    const entryArr = await db.select().from(diary).where(eq(diary.id, id)).limit(1);
    const entry = entryArr.length > 0 ? entryArr[0] : null;
    if (!entry) throw new Error("Diary entry not found");
    return entry;
  }

  static async createEntry(data: any) {
    const id = data.id || randomUUID();
    let parsedMaterial: any = { items: [], payments: [], loaders: [], linked_note_id: null, linked_note: '', shipping: 0, internal_shipping: 0 };
    if (typeof data.material_details === 'string') {
      parsedMaterial = JSON.parse(data.material_details);
    } else if (data.material_details) {
      parsedMaterial = data.material_details;
    }

    await db.insert(diary).values({
      id,
      customer_id: data.customer_id || null,
      customer_name: data.customer_name || 'Walk-in',
      phone: data.phone || '',
      date: data.date,
      linked_note_id: parsedMaterial.linked_note_id || null,
      linked_note: parsedMaterial.linked_note || '',
      shipping: parsedMaterial.shipping || 0,
      internal_shipping: parsedMaterial.internal_shipping || 0,
      total_bill: data.total_bill || 0,
      amount_paid: data.amount_paid || 0,
      payments: JSON.stringify(parsedMaterial.payments || []),
      status: data.status || 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    for (const item of parsedMaterial.items) {
      const itemId = randomUUID();
      await db.insert(diary_items).values({
        id: itemId,
        diary_id: id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || 0,
        total_price: item.total_price,
        created_at: new Date(),
        updated_at: new Date()
      });

      if (item.product_id && item.product_id !== 'LABOUR' && item.quantity > 0) {
        await db.execute(sql`UPDATE products SET current_qty = current_qty - ${item.quantity}, updated_at = ${new Date().toISOString()} WHERE id = ${item.product_id}`);
      }
    }

    for (const loader of parsedMaterial.loaders) {
      if (loader.vehicle_id) {
        await db.insert(logistics_expenses).values({
          id: randomUUID(),
          vehicle_id: loader.vehicle_id,
          invoice_id: id,
          date: data.date,
          time: new Date().toISOString().split("T")[1].slice(0, 5),
          type: "income",
          amount: loader.amount,
          category: loader.type === "loader" ? "Loading Fee" : "Shipping",
          description: loader.description || "Daily Diary Transport",
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    return id;
  }

  static async reverseEffects(diaryId: string) {
    const items = await db.select().from(diary_items).where(eq(diary_items.diary_id, diaryId));
    for (const item of items) {
       if (item.product_id && item.product_id !== 'LABOUR' && item.quantity > 0) {
          await db.execute(sql`UPDATE products SET current_qty = current_qty + ${item.quantity}, updated_at = ${new Date().toISOString()} WHERE id = ${item.product_id}`);
       }
    }
    await db.delete(diary_items).where(eq(diary_items.diary_id, diaryId));
    await db.delete(logistics_expenses).where(eq(logistics_expenses.invoice_id, diaryId));
  }

  static async updateEntry(id: string, data: any) {
    const existingArr = await db.select().from(diary).where(eq(diary.id, id)).limit(1);
    const existing = existingArr.length > 0 ? existingArr[0] : null;
    if (!existing) throw new Error("Diary entry not found");
    if (existing.status === 'cleared' || existing.status === 'ledgered') {
       throw new Error("Cannot edit a cleared or ledgered diary entry. Please use reversal flow if necessary.");
    }

    let parsedMaterial: any = { items: [], payments: [], loaders: [], linked_note_id: null, linked_note: '', shipping: 0, internal_shipping: 0 };
    if (typeof data.material_details === 'string') {
      parsedMaterial = JSON.parse(data.material_details);
    } else if (data.material_details) {
      parsedMaterial = data.material_details;
    }

    await DiaryService.reverseEffects(id);

    await db.update(diary).set({
      customer_id: data.customer_id || existing.customer_id,
      customer_name: data.customer_name || existing.customer_name,
      phone: data.phone || existing.phone,
      date: data.date || existing.date,
      linked_note_id: parsedMaterial.linked_note_id || null,
      linked_note: parsedMaterial.linked_note || '',
      shipping: parsedMaterial.shipping || 0,
      internal_shipping: parsedMaterial.internal_shipping || 0,
      total_bill: data.total_bill,
      amount_paid: data.amount_paid,
      payments: JSON.stringify(parsedMaterial.payments || []),
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(diary.id, id));

    for (const item of parsedMaterial.items) {
      await db.insert(diary_items).values({
        id: randomUUID(),
        diary_id: id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || 0,
        total_price: item.total_price,
        created_at: new Date(),
        updated_at: new Date()
      });

      if (item.product_id && item.product_id !== 'LABOUR' && item.quantity > 0) {
        await db.execute(sql`UPDATE products SET current_qty = current_qty - ${item.quantity}, updated_at = ${new Date().toISOString()} WHERE id = ${item.product_id}`);
      }
    }

    for (const loader of parsedMaterial.loaders) {
      if (loader.vehicle_id) {
        await db.insert(logistics_expenses).values({
          id: randomUUID(),
          vehicle_id: loader.vehicle_id,
          invoice_id: id,
          date: data.date || existing.date,
          time: new Date().toISOString().split("T")[1].slice(0, 5),
          type: "income",
          amount: loader.amount,
          category: loader.type === "loader" ? "Loading Fee" : "Shipping",
          description: loader.description || "Daily Diary Transport",
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    return id;
  }

  static async deleteEntry(id: string) {
    const existingArr = await db.select().from(diary).where(eq(diary.id, id)).limit(1);
    const existing = existingArr.length > 0 ? existingArr[0] : null;
    if (!existing) throw new Error("Diary entry not found");
    if (existing.status === 'cleared' || existing.status === 'ledgered') {
       throw new Error("Cannot delete a cleared or ledgered diary entry. Please use reversal flow if necessary.");
    }

    await DiaryService.reverseEffects(id);

    await db.update(diary).set({
      deleted_at: new Date(),
      version: existing.version + 1,
      updated_at: new Date()
    }).where(eq(diary.id, id));
  }

  static async settleSingle(id: string) {
    const existingArr = await db.select().from(diary).where(eq(diary.id, id)).limit(1);
    const existing = existingArr.length > 0 ? existingArr[0] : null;
    if (!existing) throw new Error("Diary entry not found");
    if (existing.status !== 'pending') throw new Error("Only pending entries can be settled");
    
    await db.update(diary).set({
       status: 'cleared',
       version: existing.version + 1,
       updated_at: new Date()
    }).where(eq(diary.id, id));
  }

  static async settleMultiple(data: any) {
    const { ids, shipping, internal_shipping, outside_loader_fee, loaders } = data;
    
    let totalBill = 0;
    let totalPaid = 0;
    let allItems: any[] = [];
    let customerId: string | null = null;
    let customerName = "Walk-in";

    for (const id of ids) {
       const existingArr = await db.select().from(diary).where(eq(diary.id, id)).limit(1);
       const existing = existingArr.length > 0 ? existingArr[0] : null;
       if (existing && existing.status === 'pending') {
          if (!customerId && existing.customer_id) customerId = existing.customer_id;
          if (existing.customer_name) customerName = existing.customer_name;
          
          totalBill += existing.total_bill;
          totalPaid += existing.amount_paid;
          
          let details: any = {};
          try {
            details = typeof existing.material_details === 'string' ? JSON.parse(existing.material_details) : existing.material_details;
          } catch (e) {}

          if (details.items) allItems = allItems.concat(details.items);

          await db.update(diary).set({
             status: 'cleared',
             version: existing.version + 1,
             updated_at: new Date()
          }).where(eq(diary.id, id));
       }
    }

    if (totalBill > 0 || totalPaid > 0) {
       const d = new Date();
       const invoiceNumber = `INV-${Math.floor(Math.random() * 1000000)}`;
       const invoiceId = randomUUID();
       
       const totalShipping = Number(shipping) || 0;
       const totalInternal = Number(internal_shipping) || 0;
       const totalOutside = Number(outside_loader_fee) || 0;

       // 1. Create Formal Invoice for Sales Module
       await db.insert(invoices).values({
          id: invoiceId,
          invoice_number: invoiceNumber,
          customer_id: customerId,
          customer_name: customerName,
          status: 'Completed',
          date: d.toISOString().split("T")[0],
          time: d.toISOString().split("T")[1].slice(0, 5),
          subtotal: totalBill - totalShipping,
          shipping: totalShipping,
          internal_shipping: totalInternal,
          outside_loader_fee: totalOutside,
          grand_total: totalBill,
          amount_paid: totalPaid,
          version: 1,
          created_at: d,
          updated_at: d
       });

       // 2. Create Invoice Items
       for (const item of allItems) {
          await db.insert(invoice_items).values({
             id: randomUUID(),
             invoice_id: invoiceId,
             product_id: item.product_id || null,
             description: item.description || '',
             quantity: item.quantity || 0,
             unit_price: item.unit_price || 0,
             total_price: item.total_price || 0,
             version: 1,
             created_at: d,
             updated_at: d
          });
       }

       // 3. Logistics Integration (Income for Company Vehicles)
       if (loaders && Array.isArray(loaders)) {
          for (const loader of loaders) {
             if (loader.vehicle_id && loader.fee > 0) {
                await db.insert(logistics_expenses).values({
                   id: randomUUID(),
                   vehicle_id: String(loader.vehicle_id),
                   invoice_id: invoiceId,
                   date: d.toISOString().split("T")[0],
                   time: d.toISOString().split("T")[1].slice(0, 5),
                   type: "income",
                   amount: loader.fee,
                   category: "Shipping",
                   description: `Delivery for Invoice ${invoiceNumber} (via Daily Diary Settle)`,
                   version: 1,
                   created_at: d,
                   updated_at: d
                });
             }
          }
       }

       // 4. Update Ledger if Customer is registered
       if (customerId) {
          const custArr = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
          const cust = custArr.length > 0 ? custArr[0] : null;
          if (cust) {
             const newRunningBalance = cust.balance + (totalBill - totalPaid);
             
             await db.insert(ledgers).values({
                id: randomUUID(),
                customer_id: customerId,
                date: d.toISOString().split("T")[0],
                time: d.toISOString().split("T")[1].slice(0, 5),
                type: "charge",
                amount: totalBill, 
                payment_amount: totalPaid,
                running_balance: newRunningBalance,
                description: `Invoice ${invoiceNumber} (Settled from Daily Diary)`,
                reference: invoiceId,
                version: 1,
                created_at: d,
                updated_at: d
             });

             await db.update(customers).set({
                balance: newRunningBalance,
                total_charged: cust.total_charged + totalBill,
                total_paid: cust.total_paid + totalPaid,
                updated_at: d
             }).where(eq(customers.id, customerId));
          }
       }
    }
  }

  static async payPartial(data: any) {
    const id = randomUUID();
    const payload = {
      id,
      customer_id: data.customer_id || null,
      customer_name: data.name,
      phone: data.phone,
      date: data.date || new Date().toISOString().split("T")[0],
      total_bill: 0,
      amount_paid: data.amount,
      payments: JSON.stringify([{ id: Date.now(), amount: data.amount, time: data.time || new Date().toISOString().split("T")[1].slice(0, 5), note: data.note }]),
      status: 'cleared', 
      created_at: new Date(),
      updated_at: new Date()
    };
    await db.insert(diary).values(payload);
    return id;
  }

  static async migrateToLedger(data: any) {
    const { cid, name, phone, entryIds } = data;
    let customerId = cid;

    if (!customerId) {
      if (!name) throw new Error("Customer name is required to create a new ledger account");
      customerId = randomUUID();
      const customerNumber = `CUST-${Math.floor(Math.random() * 100000)}`;
      await db.insert(customers).values({
          id: customerId,
          customer_number: customerNumber,
          name: name,
          phone: phone || '',
          type: 'retail',
          balance: 0,
          total_charged: 0,
          total_paid: 0,
          created_at: new Date(),
          updated_at: new Date()
      });
    }

    let totalBill = 0;
    let totalPaid = 0;
    let allItems: any[] = [];
    let allLoaders: any[] = [];
    let totalShipping = 0;
    let totalInternalShipping = 0;
    let totalOutsideLoader = 0;

    for (const id of entryIds) {
       const existingArr = await db.select().from(diary).where(eq(diary.id, id)).limit(1);
       const existing = existingArr.length > 0 ? existingArr[0] : null;
       if (existing && existing.status !== 'ledgered') {
          totalBill += existing.total_bill;
          totalPaid += existing.amount_paid;
          
          let details: any = {};
          try {
            details = typeof existing.material_details === 'string' ? JSON.parse(existing.material_details) : existing.material_details;
          } catch (e) {}

          if (details.items) allItems = allItems.concat(details.items);
          if (details.loaders) allLoaders = allLoaders.concat(details.loaders);
          if (details.shipping) totalShipping += details.shipping;
          if (details.internal_shipping) totalInternalShipping += details.internal_shipping;
          if (details.outside_loader_fee) totalOutsideLoader += details.outside_loader_fee;

          await db.update(diary).set({
             status: 'ledgered',
             version: existing.version + 1,
             updated_at: new Date()
          }).where(eq(diary.id, id));
       }
    }

    if (totalBill > 0 || totalPaid > 0) {
       const d = new Date();
       const custArr = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
       const cust = custArr.length > 0 ? custArr[0] : null;
       if (!cust) throw new Error("Customer not found for ledger migration");

       const newRunningBalance = cust.balance + (totalBill - totalPaid);
       const invoiceNumber = `INV-${Math.floor(Math.random() * 1000000)}`;
       const invoiceId = randomUUID();

       // 1. Create Formal Invoice for Sales Module (without double-deducting stock)
       await db.insert(invoices).values({
          id: invoiceId,
          invoice_number: invoiceNumber,
          customer_id: customerId,
          customer_name: cust.name,
          status: 'Completed',
          date: d.toISOString().split("T")[0],
          time: d.toISOString().split("T")[1].slice(0, 5),
          subtotal: totalBill - totalShipping,
          shipping: totalShipping,
          internal_shipping: totalInternalShipping,
          outside_loader_fee: totalOutsideLoader,
          grand_total: totalBill,
          amount_paid: totalPaid,
          version: 1,
          created_at: d,
          updated_at: d
       });

       // 2. Create Invoice Items
       for (const item of allItems) {
          await db.insert(invoice_items).values({
             id: randomUUID(),
             invoice_id: invoiceId,
             product_id: item.product_id || null,
             description: item.description || '',
             quantity: item.quantity || 0,
             unit_price: item.unit_price || 0,
             total_price: item.total_price || 0,
             version: 1,
             created_at: d,
             updated_at: d
          });
       }

       // 3. Logistics Integration (Income for Company Vehicles)
       for (const loader of allLoaders) {
          if (loader.vehicle_id && loader.fee > 0) {
             await db.insert(logistics_expenses).values({
                id: randomUUID(),
                vehicle_id: String(loader.vehicle_id),
                invoice_id: invoiceId,
                date: d.toISOString().split("T")[0],
                time: d.toISOString().split("T")[1].slice(0, 5),
                type: "income",
                amount: loader.fee,
                category: "Shipping",
                description: `Delivery for Invoice ${invoiceNumber} (via Daily Diary)`,
                version: 1,
                created_at: d,
                updated_at: d
             });
          }
       }

       // 4. Create Ledger Entry linking to Invoice
       await db.insert(ledgers).values({
          id: randomUUID(),
          customer_id: customerId,
          date: d.toISOString().split("T")[0],
          time: d.toISOString().split("T")[1].slice(0, 5),
          type: "charge",
          amount: totalBill, 
          payment_amount: totalPaid,
          running_balance: newRunningBalance,
          description: `Invoice ${invoiceNumber} (Migrated from Daily Diary)`,
          reference: invoiceId,
          version: 1,
          created_at: d,
          updated_at: d
       });

       await db.update(customers).set({
          balance: newRunningBalance,
          total_charged: cust.total_charged + totalBill,
          total_paid: cust.total_paid + totalPaid,
          updated_at: d
       }).where(eq(customers.id, customerId));
       
       // Update the diary entries so they officially belong to this new customer
       if (!cid) {
          for (const id of entryIds) {
             await db.update(diary).set({ customer_id: customerId }).where(eq(diary.id, id));
          }
       }
    }

    return customerId;
  }
}
