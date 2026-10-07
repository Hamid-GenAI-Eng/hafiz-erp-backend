const fs = require("fs");
const path = require("path");

const filePath = path.resolve("C:/My working/HamidTech_Ventures/Clients/Hafiz Building Materials and Kitchen-bath accessories/Hafiz building material backend/src/services/DiaryService.ts");
let content = fs.readFileSync(filePath, "utf8");

const startStr = "  static async settleMultiple(data: any) {";
const endStr = "  static async payPartial(data: any) {";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find boundaries");
  process.exit(1);
}

const replacement = `  static async settleMultiple(data: any) {
    const { ids, shipping, internal_shipping, outside_loader_fee, loaders } = data;
    
    return await getDb().transaction(async (tx) => {
      let totalBill = 0;
      let totalPaid = 0;
      let allItems: any[] = [];
      let customerId: string | null = null;
      let customerName = "Walk-in";
      let customerPhone = "";
      let totalDiscount = 0;

      for (const id of ids) {
         const existingArr = await tx.select().from(diary).where(eq(diary.id, id)).limit(1);
         const existing = existingArr.length > 0 ? existingArr[0] : null;
         if (existing && (existing.status === 'pending' || existing.status === 'cleared')) {
            if (!customerId && existing.customer_id) customerId = existing.customer_id;
            if (existing.customer_name) customerName = existing.customer_name;
            if (existing.phone) customerPhone = existing.phone;
            
            totalBill += existing.total_bill;
            totalPaid += existing.amount_paid;
            totalDiscount += existing.discount || 0;
            
            let details: any = {};
            try {
              const parsed = typeof existing.material_details === 'string' ? JSON.parse(existing.material_details) : existing.material_details;
              if (Array.isArray(parsed)) {
                details = { items: parsed };
              } else {
                details = parsed || {};
              }
            } catch (e) {
              details = { items: [{ description: existing.material_details, quantity: 1, unit_price: existing.total_bill, total_price: existing.total_bill }] };
            }

            if (details.items) allItems = allItems.concat(details.items);

            await tx.update(diary).set({
               status: 'ledgered',
               version: existing.version + 1,
               updated_at: new Date()
            }).where(eq(diary.id, id));
         }
      }

      if (totalBill > 0 || totalPaid > 0) {
         const d = new Date();
         const invoiceNumber = \`INV-\${Math.floor(Math.random() * 1000000)}\`;
         const invoiceId = randomUUID();
         
         const totalShipping = Number(shipping) || 0;
         const totalInternal = Number(internal_shipping) || 0;
         const totalOutside = Number(outside_loader_fee) || 0;

         // 1. Create Formal Invoice for Sales Module
         await tx.insert(invoices).values({
            id: invoiceId,
            invoice_number: invoiceNumber,
            customer_id: customerId,
            walkin_name: !customerId ? customerName : null,
            walkin_phone: !customerId ? customerPhone : null,
            status: 'Completed',
            date: d.toISOString().split("T")[0],
            time: d.toTimeString().slice(0, 5),
            subtotal: totalBill - totalShipping - totalInternal - totalOutside + totalDiscount,
            total_discount: totalDiscount,
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
            await tx.insert(invoice_items).values({
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
                  await tx.insert(logistics_expenses).values({
                     id: randomUUID(),
                     vehicle_id: String(loader.vehicle_id),
                     invoice_id: invoiceId,
                     date: d.toISOString().split("T")[0],
                     // BUG FIX: Removed 'time' field as it does not exist in logistics_expenses schema
                     type: "income",
                     amount: loader.fee,
                     category: "Shipping",
                     description: \`Delivery for Invoice \${invoiceNumber} (via Daily Diary Settle)\`,
                     version: 1,
                     created_at: d,
                     updated_at: d
                  });
               }
            }
         }

         // 4. Update Ledger if Customer is registered
         if (customerId) {
            const custArr = await tx.select().from(customers).where(eq(customers.id, customerId)).limit(1);
            const cust = custArr.length > 0 ? custArr[0] : null;
            if (cust) {
               const newRunningBalance = cust.balance + (totalBill - totalPaid);
               
               await tx.insert(ledgers).values({
                  id: randomUUID(),
                  customer_id: customerId,
                  date: d.toISOString().split("T")[0],
                  time: d.toTimeString().slice(0, 5),
                  type: "charge",
                  amount: totalBill, 
                  payment_amount: totalPaid,
                  running_balance: newRunningBalance,
                  description: \`Invoice \${invoiceNumber} (Settled from Daily Diary)\`,
                  reference: invoiceId,
                  version: 1,
                  created_at: d,
                  updated_at: d
               });

               await tx.update(customers).set({
                  balance: newRunningBalance,
                  total_charged: cust.total_charged + totalBill,
                  total_paid: cust.total_paid + totalPaid,
                  updated_at: d
               }).where(eq(customers.id, customerId));
            }
         }
      }
    });
  }

`;

const newContent = content.slice(0, startIndex) + replacement + content.slice(endIndex);
fs.writeFileSync(filePath, newContent);
console.log("Successfully rewrote settleMultiple");
