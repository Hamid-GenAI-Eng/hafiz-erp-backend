import { db } from '../config/database';
import { invoices, invoice_items, ledgers, supplier_ledgers, misc_expenses, customers, suppliers, products, diary } from '../models/schema';
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm';

export class DashboardService {
  static async getDashboardData(range: string) {
    const now = new Date();
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    if (range === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === 'monthly') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (range === 'yearly') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = now.toISOString().split("T")[0];

    // 1. Cash In
    const invoiceCashInRes = await db.select({ total: sql<number>`SUM(amount_paid)` })
      .from(invoices)
      .where(and(eq(invoices.status, 'active'), gte(invoices.date, startDateStr), lte(invoices.date, endDateStr)));
    const invoiceCashIn = invoiceCashInRes[0]?.total || 0;

    const ledgerCashInRes = await db.select({ total: sql<number>`SUM(payment_amount)` })
      .from(ledgers)
      .where(and(eq(ledgers.type, 'payment'), gte(ledgers.date, startDateStr), lte(ledgers.date, endDateStr)));
    const ledgerCashIn = ledgerCashInRes[0]?.total || 0;

    const diaryCashInRes = await db.select({ total: sql<number>`SUM(amount_paid)` })
      .from(diary)
      .where(and(
         sql`${diary.status} IN ('pending', 'cleared')`, 
         gte(diary.date, startDateStr), lte(diary.date, endDateStr)
      ));
    const diaryCashIn = diaryCashInRes[0]?.total || 0;

    const totalCashIn = invoiceCashIn + ledgerCashIn + diaryCashIn;

    // 2. Cash Out
    const supplierCashOutRes = await db.select({ total: sql<number>`SUM(payment_amount)` })
      .from(supplier_ledgers)
      .where(and(gte(supplier_ledgers.date, startDateStr), lte(supplier_ledgers.date, endDateStr)));
    const supplierCashOut = supplierCashOutRes[0]?.total || 0;

    const miscExpRes = await db.select({ total: sql<number>`SUM(amount)` })
      .from(misc_expenses)
      .where(and(gte(misc_expenses.date, startDateStr), lte(misc_expenses.date, endDateStr)));
    const miscExp = miscExpRes[0]?.total || 0;

    const totalCashOut = supplierCashOut + miscExp;

    // 3. Receivables & Payables
    const receivablesRes = await db.select({ total: sql<number>`SUM(balance)` })
      .from(customers)
      .where(sql`${customers.balance} > 0`);
    const receivable = receivablesRes[0]?.total || 0;

    const payablesRes = await db.select({ total: sql<number>`SUM(balance_owed)` })
      .from(suppliers)
      .where(sql`${suppliers.balance_owed} > 0`);
    const payable = payablesRes[0]?.total || 0;

    // 4. Quantities Sold
    const itemsRes = await db.select({
      category: products.category,
      qty: sql<number>`SUM(${invoice_items.quantity})`
    })
    .from(invoice_items)
    .innerJoin(invoices, eq(invoice_items.invoice_id, invoices.id))
    .innerJoin(products, eq(invoice_items.product_id, products.id))
    .where(and(eq(invoices.status, 'active'), gte(invoices.date, startDateStr), lte(invoices.date, endDateStr)))
    .groupBy(products.category);

    let cementSold = 0;
    let sandSold = 0;
    let crushSold = 0;
    let steelSold = 0;

    for (const row of itemsRes) {
      if (row.category?.toLowerCase() === 'cement') cementSold += row.qty;
      if (row.category?.toLowerCase() === 'sand') sandSold += row.qty;
      if (row.category?.toLowerCase() === 'crush') crushSold += row.qty;
      if (row.category?.toLowerCase() === 'steel') steelSold += row.qty;
    }

    // 5. Net Profit
    const netProfit = totalCashIn - totalCashOut;

    // 6. Recent Invoices
    const recentInvoices = await db.select({
      id: invoices.invoice_number,
      customer_name: sql<string>`COALESCE(${customers.name}, ${invoices.walkin_name}, 'Walk-in')`,
      amount: invoices.grand_total,
      status: invoices.status,
      date: invoices.date
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customer_id, customers.id))
    .orderBy(desc(invoices.created_at))
    .limit(5);

    // 7. Recent Transactions
    const recentTransactions = await db.select({
      date: ledgers.date,
      method: ledgers.method,
      amount: sql<number>`CASE WHEN ${ledgers.amount} > 0 THEN ${ledgers.amount} ELSE ${ledgers.payment_amount} END`,
      type: ledgers.type,
      description: ledgers.description
    })
    .from(ledgers)
    .orderBy(desc(ledgers.created_at))
    .limit(5);

    // 8. Chart Data
    const chartData = [];
    if (range === 'daily') {
      chartData.push({ name: startDateStr, revenue: totalCashIn, expenses: totalCashOut });
    } else {
      const revGroup = await db.select({
        date: invoices.date,
        total: sql<number>`SUM(amount_paid)`
      }).from(invoices)
      .where(and(eq(invoices.status, 'active'), gte(invoices.date, startDateStr), lte(invoices.date, endDateStr)))
      .groupBy(invoices.date);

      for (const row of revGroup) {
        chartData.push({ name: row.date, revenue: row.total, expenses: 0 }); 
      }
    }

    return {
      metrics: {
        cashIn: totalCashIn,
        cashOut: totalCashOut,
        netProfit,
        expenses: miscExp,
        receivable,
        payable,
        cementSold,
        sandSold,
        crushSold,
        steelSold
      },
      chartData,
      recentInvoices,
      recentTransactions
    };
  }
}
