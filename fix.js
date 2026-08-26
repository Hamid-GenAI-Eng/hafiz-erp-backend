const fs = require('fs');

const content = import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { diary, diary_items, products, logistics_expenses, ledgers, customers } from "../models/schema";
import { randomUUID } from "crypto";

export class DiaryService {
  static async getAll() {
    const entries = await db.select().from(diary).where(sql\deleted_at IS NULL\).orderBy(desc(diary.created_at));
    
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
    const entry = await db.select().from(diary).where(eq(diary.id, id)).get();
    if (!entry) throw new Error("Diary entry not found");
    return entry;
  }

  static async createEntry(data: any) {
    return await db.transaction(async (tx) => {
      const id = data.id || randomUUID();
      let parsedMaterial = { items: [], payments: [], loaders: [], linked_note_id: null, linked_note: '', shipping: 0, internal_shipping: 0 };
      if (typeof data.material_details === 'string') {
        parsedMaterial = JSON.parse(data.material_details);
      } else if (data.material_details) {
        parsedMaterial = data.material_details;
      }

      await tx.insert(diary).values({
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
        await tx.insert(diary_items).values({
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
          await tx.run(sql\UPDATE products SET current_qty = current_qty - \, updated_at = '\' WHERE id = '\'\);
        }
      }

      for (const loader of parsedMaterial.loaders) {
        if (loader.vehicle_id) {
          await tx.insert(logistics_expenses).values({
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
    });
  }

  static async reverseEffects(tx: any, diaryId: string) {
    const items = await tx.select().from(diary_items).where(eq(diary_items.diary_id, diaryId));
    for (const item of items) {
       if (item.product_id && item.product_id !== 'LABOUR' && item.quantity > 0) {
          await tx.run(sql\UPDATE products SET current_qty = current_qty + \, updated_at = '\' WHERE id = '\'\);
       }
    }
    await tx.delete(diary_items).where(eq(diary_items.diary_id, diaryId));
    await tx.delete(logistics_expenses).where(eq(logistics_expenses.invoice_id, diaryId));
  }

  static async updateEntry(id: string, data: any) {
    return await db.transaction(async (tx) => {
      const existing = await tx.select().from(diary).where(eq(diary.id, id)).get();
      if (!existing) throw new Error("Diary entry not found");
      if (existing.status === 'cleared' || existing.status === 'ledgered') {
         throw new Error("Cannot edit a cleared or ledgered diary entry. Please use reversal flow if necessary.");
      }

      let parsedMaterial = { items: [], payments: [], loaders: [], linked_note_id: null, linked_note: '', shipping: 0, internal_shipping: 0 };
      if (typeof data.material_details === 'string') {
        parsedMaterial = JSON.parse(data.material_details);
      } else if (data.material_details) {
        parsedMaterial = data.material_details;
      }

      await DiaryService.reverseEffects(tx, id);

      await tx.update(diary).set({
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
        await tx.insert(diary_items).values({
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
          await tx.run(sql\UPDATE products SET current_qty = current_qty - \, updated_at = '\' WHERE id = '\'\);
        }
      }

      for (const loader of parsedMaterial.loaders) {
        if (loader.vehicle_id) {
          await tx.insert(logistics_expenses).values({
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
    });
  }

  static async deleteEntry(id: string) {
    return await db.transaction(async (tx) => {
      const existing = await tx.select().from(diary).where(eq(diary.id, id)).get();
      if (!existing) throw new Error("Diary entry not found");
      if (existing.status === 'cleared' || existing.status === 'ledgered') {
         throw new Error("Cannot delete a cleared or ledgered diary entry. Please use reversal flow if necessary.");
      }

      await DiaryService.reverseEffects(tx, id);

      await tx.update(diary).set({
        deleted_at: new Date(),
        version: existing.version + 1,
        updated_at: new Date()
      }).where(eq(diary.id, id));
    });
  }

  static async settleSingle(id: string) {
    return await db.transaction(async (tx) => {
      const existing = await tx.select().from(diary).where(eq(diary.id, id)).get();
      if (!existing) throw new Error("Diary entry not found");
      if (existing.status !== 'pending') throw new Error("Only pending entries can be settled");
      
      await tx.update(diary).set({
         status: 'cleared',
         version: existing.version + 1,
         updated_at: new Date()
      }).where(eq(diary.id, id));
    });
  }

  static async settleMultiple(ids: string[]) {
    return await db.transaction(async (tx) => {
       for (const id of ids) {
         const existing = await tx.select().from(diary).where(eq(diary.id, id)).get();
         if (existing && existing.status === 'pending') {
            await tx.update(diary).set({
               status: 'cleared',
               version: existing.version + 1,
               updated_at: new Date()
            }).where(eq(diary.id, id));
         }
       }
    });
  }

  static async payPartial(data: any) {
    return await db.transaction(async (tx) => {
      const id = randomUUID();
      const payload = {
        id,
        customer_id: null,
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
      await tx.insert(diary).values(payload);
      return id;
    });
  }

  static async migrateToLedger(data: any) {
    return await db.transaction(async (tx) => {
      const { cid, name, phone, entryIds } = data;
      if (!cid) throw new Error("Customer ID is required to migrate to ledger");

      let totalBill = 0;
      let totalPaid = 0;

      for (const id of entryIds) {
         const existing = await tx.select().from(diary).where(eq(diary.id, id)).get();
         if (existing && existing.status !== 'ledgered') {
            totalBill += existing.total_bill;
            totalPaid += existing.amount_paid;

            await tx.update(diary).set({
               status: 'ledgered',
               version: existing.version + 1,
               updated_at: new Date()
            }).where(eq(diary.id, id));
         }
      }

      if (totalBill > 0 || totalPaid > 0) {
         const d = new Date();
         await tx.insert(ledgers).values({
            id: randomUUID(),
            customer_id: cid,
            date: d.toISOString().split("T")[0],
            time: d.toISOString().split("T")[1].slice(0, 5),
            type: "invoice",
            amount: totalBill, 
            payment_amount: totalPaid,
            description: \Migrated from Daily Diary (\ entries)\,
            version: 1,
            created_at: d,
            updated_at: d
         });
      }
    });
  }
}
;

fs.writeFileSync('src/services/DiaryService.ts', content);
