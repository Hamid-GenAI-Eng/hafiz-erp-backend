import { getDb } from '../config/database';
import { invoices, invoice_items, ledgers, supplier_ledgers, misc_expenses, customers, suppliers, products, diary, diary_items, logistics_expenses } from '../models/schema';
import { sql, eq, and, gte, lte, desc, isNull } from 'drizzle-orm';

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

    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 1. Cash In
    const invoiceCashInRes = await getDb().select({ total: sql<number>`SUM(amount_paid)` })
      .from(invoices)
      .where(and(
         sql`${invoices.status} IN ('active', 'Completed', 'Paid')`, 
         sql`${invoices.customer_id} IS NULL`, // Walk-ins only, ledgers handle the rest
         isNull(invoices.deleted_at),
         gte(invoices.date, startDateStr), lte(invoices.date, endDateStr)
      ));
    const invoiceCashIn = invoiceCashInRes[0]?.total || 0;

    const ledgerCashInRes = await getDb().select({ total: sql<number>`SUM(payment_amount)` })
      .from(ledgers)
      .where(and(sql`${ledgers.payment_amount} > 0`, gte(ledgers.date, startDateStr), lte(ledgers.date, endDateStr)));
    const ledgerCashIn = ledgerCashInRes[0]?.total || 0;

    const diaryCashInRes = await getDb().select({ total: sql<number>`SUM(amount_paid)` })
      .from(diary)
      .where(and(
         sql`${diary.status} = 'pending'`, 
         isNull(diary.deleted_at),
         gte(diary.date, startDateStr), lte(diary.date, endDateStr)
      ));
    const diaryCashIn = diaryCashInRes[0]?.total || 0;

    const totalCashIn = invoiceCashIn + ledgerCashIn + diaryCashIn;

    // 2. Cash Out
    const supplierCashOutRes = await getDb().select({ total: sql<number>`SUM(payment_amount)` })
      .from(supplier_ledgers)
      .where(and(sql`${supplier_ledgers.payment_amount} > 0`, gte(supplier_ledgers.date, startDateStr), lte(supplier_ledgers.date, endDateStr)));
    const supplierCashOut = supplierCashOutRes[0]?.total || 0;

    const miscExpRes = await getDb().select({ total: sql<number>`SUM(amount)` })
      .from(misc_expenses)
      .where(and(gte(misc_expenses.date, startDateStr), lte(misc_expenses.date, endDateStr)));
    const miscExp = miscExpRes[0]?.total || 0;

    const logisticsExpRes = await getDb().select({ total: sql<number>`SUM(amount)` })
      .from(logistics_expenses)
      .where(and(eq(logistics_expenses.type, 'expense'), gte(logistics_expenses.date, startDateStr), lte(logistics_expenses.date, endDateStr)));
    const logisticsExp = logisticsExpRes[0]?.total || 0;

    const outsideLoaderFeesRes = await getDb().select({ total: sql<number>`SUM(outside_loader_fee)` })
      .from(invoices)
      .where(and(sql`${invoices.status} IN ('active', 'Completed', 'Paid')`, sql`${invoices.outside_loader_fee} > 0`, isNull(invoices.deleted_at), gte(invoices.date, startDateStr), lte(invoices.date, endDateStr)));
    const outsideLoaderFees = outsideLoaderFeesRes[0]?.total || 0;

    const totalCashOut = supplierCashOut + miscExp + logisticsExp + outsideLoaderFees;
    const totalExpensesForDashboard = miscExp + logisticsExp + outsideLoaderFees;

    // 3. Receivables & Payables
    const receivablesRes = await getDb().select({ total: sql<number>`SUM(balance)` })
      .from(customers)
      .where(and(sql`${customers.balance} > 0`, isNull(customers.deleted_at)));
    const receivable = receivablesRes[0]?.total || 0;

    const payablesRes = await getDb().select({ total: sql<number>`SUM(balance_owed)` })
      .from(suppliers)
      .where(and(sql`${suppliers.balance_owed} > 0`, isNull(suppliers.deleted_at)));
    const payable = payablesRes[0]?.total || 0;

    // 4. Quantities Sold
    const itemsRes = await getDb().select({
      category: products.category,
      qty: sql<number>`SUM(${invoice_items.quantity})`
    })
    .from(invoice_items)
    .innerJoin(invoices, eq(invoice_items.invoice_id, invoices.id))
    .innerJoin(products, eq(invoice_items.product_id, products.id))
    .where(and(sql`${invoices.status} IN ('active', 'Completed', 'Paid')`, gte(invoices.date, startDateStr), lte(invoices.date, endDateStr)))
    .groupBy(products.category);

    const diaryItemsRes = await getDb().select({
      category: products.category,
      qty: sql<number>`SUM(${diary_items.quantity})`
    })
    .from(diary_items)
    .innerJoin(diary, eq(diary_items.diary_id, diary.id))
    .innerJoin(products, eq(diary_items.product_id, products.id))
    .where(and(sql`${diary.status} = 'pending'`, gte(diary.date, startDateStr), lte(diary.date, endDateStr)))
    .groupBy(products.category);

    let cementSold = 0;
    let sandSold = 0;
    let crushSold = 0;
    let steelSold = 0;

    for (const row of [...itemsRes, ...diaryItemsRes]) {
      if (row.category?.toLowerCase() === 'cement') cementSold += row.qty;
      if (row.category?.toLowerCase() === 'sand') sandSold += row.qty;
      if (row.category?.toLowerCase() === 'crush') crushSold += row.qty;
      if (row.category?.toLowerCase() === 'steel') steelSold += row.qty;
    }

    // 5. Net Profit (Sales Rev - COGS - Expenses)
    const cogsRes = await getDb().select({
      sales: sql<number>`SUM(${invoice_items.total_price})`,
      cogs: sql<number>`SUM(${invoice_items.quantity} * COALESCE(${products.cost_price}, 0))`
    })
    .from(invoice_items)
    .innerJoin(invoices, eq(invoice_items.invoice_id, invoices.id))
    .leftJoin(products, eq(invoice_items.product_id, products.id))
    .where(and(
      sql`${invoices.status} IN ('active', 'Completed', 'Paid')`, 
      isNull(invoices.deleted_at),
      gte(invoices.date, startDateStr), 
      lte(invoices.date, endDateStr)
    ));
    
    const diaryCogsRes = await getDb().select({
      sales: sql<number>`SUM(${diary_items.total_price})`,
      cogs: sql<number>`SUM(${diary_items.quantity} * COALESCE(${products.cost_price}, 0))`
    })
    .from(diary_items)
    .innerJoin(diary, eq(diary_items.diary_id, diary.id))
    .leftJoin(products, eq(diary_items.product_id, products.id))
    .where(and(
      sql`${diary.status} = 'pending'`,
      isNull(diary.deleted_at),
      gte(diary.date, startDateStr),
      lte(diary.date, endDateStr)
    ));

    const totalSales = (cogsRes[0]?.sales || 0) + (diaryCogsRes[0]?.sales || 0);
    const totalCOGS = (cogsRes[0]?.cogs || 0) + (diaryCogsRes[0]?.cogs || 0);

    const internalShippingRes = await getDb().select({ total: sql<number>`SUM(internal_shipping)` })
      .from(invoices)
      .where(and(
        sql`${invoices.status} IN ('active', 'Completed', 'Paid')`,
        isNull(invoices.deleted_at),
        gte(invoices.date, startDateStr),
        lte(invoices.date, endDateStr)
      ));
    const totalInternalShipping = internalShippingRes[0]?.total || 0;

    const netProfit = totalSales + totalInternalShipping - totalCOGS - totalExpensesForDashboard;

    // 6. Recent Invoices
    const recentInvoices = await getDb().select({
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
    const recentTransactions = await getDb().select({
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
    const chartMap = new Map<string, { cashIn: number, cashOut: number }>();
    
    const cur = new Date(startDate);
    while (cur <= now) {
      const dStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      chartMap.set(dStr, { cashIn: 0, cashOut: 0 });
      cur.setDate(cur.getDate() + 1);
    }

    const invCashInGroup = await getDb().select({ date: invoices.date, total: sql<number>`SUM(amount_paid)` })
      .from(invoices).where(and(sql`${invoices.status} IN ('active', 'Completed', 'Paid')`, sql`${invoices.customer_id} IS NULL`, isNull(invoices.deleted_at), gte(invoices.date, startDateStr), lte(invoices.date, endDateStr)))
      .groupBy(invoices.date);
    invCashInGroup.forEach((r: any) => { if(chartMap.has(r.date)) chartMap.get(r.date)!.cashIn += r.total; });

    const ledCashInGroup = await getDb().select({ date: ledgers.date, total: sql<number>`SUM(payment_amount)` })
      .from(ledgers).where(and(sql`${ledgers.payment_amount} > 0`, gte(ledgers.date, startDateStr), lte(ledgers.date, endDateStr)))
      .groupBy(ledgers.date);
    ledCashInGroup.forEach((r: any) => { if(chartMap.has(r.date)) chartMap.get(r.date)!.cashIn += r.total; });

    const diaCashInGroup = await getDb().select({ date: diary.date, total: sql<number>`SUM(amount_paid)` })
      .from(diary).where(and(sql`${diary.status} = 'pending'`, isNull(diary.deleted_at), gte(diary.date, startDateStr), lte(diary.date, endDateStr)))
      .groupBy(diary.date);
    diaCashInGroup.forEach((r: any) => { if(chartMap.has(r.date)) chartMap.get(r.date)!.cashIn += r.total; });

    const supCashOutGroup = await getDb().select({ date: supplier_ledgers.date, total: sql<number>`SUM(payment_amount)` })
      .from(supplier_ledgers).where(and(sql`${supplier_ledgers.payment_amount} > 0`, gte(supplier_ledgers.date, startDateStr), lte(supplier_ledgers.date, endDateStr)))
      .groupBy(supplier_ledgers.date);
    supCashOutGroup.forEach((r: any) => { if(chartMap.has(r.date)) chartMap.get(r.date)!.cashOut += r.total; });

    const miscOutGroup = await getDb().select({ date: misc_expenses.date, total: sql<number>`SUM(amount)` })
      .from(misc_expenses).where(and(gte(misc_expenses.date, startDateStr), lte(misc_expenses.date, endDateStr)))
      .groupBy(misc_expenses.date);
    miscOutGroup.forEach((r: any) => { if(chartMap.has(r.date)) chartMap.get(r.date)!.cashOut += r.total; });

    const logOutGroup = await getDb().select({ date: logistics_expenses.date, total: sql<number>`SUM(amount)` })
      .from(logistics_expenses).where(and(eq(logistics_expenses.type, 'expense'), gte(logistics_expenses.date, startDateStr), lte(logistics_expenses.date, endDateStr)))
      .groupBy(logistics_expenses.date);
    logOutGroup.forEach((r: any) => { if(chartMap.has(r.date)) chartMap.get(r.date)!.cashOut += r.total; });

    const outLoaderOutGroup = await getDb().select({ date: invoices.date, total: sql<number>`SUM(outside_loader_fee)` })
      .from(invoices).where(and(sql`${invoices.status} IN ('active', 'Completed', 'Paid')`, sql`${invoices.outside_loader_fee} > 0`, isNull(invoices.deleted_at), gte(invoices.date, startDateStr), lte(invoices.date, endDateStr)))
      .groupBy(invoices.date);
    outLoaderOutGroup.forEach((r: any) => { if(chartMap.has(r.date)) chartMap.get(r.date)!.cashOut += r.total; });

    const chartData = Array.from(chartMap.entries()).map(([date, data]) => ({ name: date, ...data }));
    chartData.sort((a, b) => a.name.localeCompare(b.name));

    return {
      metrics: {
        cashIn: totalCashIn,
        cashOut: totalCashOut,
        netProfit,
        expenses: totalExpensesForDashboard,
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
