import { getDb } from '../config/database';
import { products, customers, suppliers, diary } from '../models/schema';
import { sql, and, isNull } from 'drizzle-orm';

export class NotificationService {
  static async getAlerts() {
    const alerts: any[] = [];

    // 1. Low Stock Alerts
    const lowStockQuery = await getDb().select({
      count: sql<number>`COUNT(*)`
    })
    .from(products)
    .where(and(sql`${products.current_qty} <= ${products.min_alert}`, isNull(products.deleted_at)));

    const lowStockCount = Number(lowStockQuery[0]?.count || 0);
    if (lowStockCount > 0) {
      alerts.push({
        id: 'low_stock',
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${lowStockCount} product(s) have reached or dropped below their minimum stock alert level.`,
        actionUrl: '/stock/manage',
        count: lowStockCount
      });
    }

    // 2. Customer Dues
    const customerDuesQuery = await getDb().select({
      count: sql<number>`COUNT(*)`,
      total: sql<number>`SUM(${customers.balance})`
    })
    .from(customers)
    .where(and(sql`${customers.balance} > 0`, isNull(customers.deleted_at)));

    const customerDuesCount = Number(customerDuesQuery[0]?.count || 0);
    const customerDuesTotal = Number(customerDuesQuery[0]?.total || 0);
    
    if (customerDuesCount > 0) {
      alerts.push({
        id: 'customer_dues',
        type: 'info',
        title: 'Customer Dues',
        message: `${customerDuesCount} customer(s) have outstanding dues totaling PKR ${customerDuesTotal.toLocaleString()}.`,
        actionUrl: '/crm/ledger',
        count: customerDuesCount
      });
    }

    // 3. Supplier Payables
    const supplierPayablesQuery = await getDb().select({
      count: sql<number>`COUNT(*)`,
      total: sql<number>`SUM(${suppliers.balance_owed})`
    })
    .from(suppliers)
    .where(and(sql`${suppliers.balance_owed} > 0`, isNull(suppliers.deleted_at)));

    const supplierPayablesCount = Number(supplierPayablesQuery[0]?.count || 0);
    const supplierPayablesTotal = Number(supplierPayablesQuery[0]?.total || 0);

    if (supplierPayablesCount > 0) {
      alerts.push({
        id: 'supplier_payables',
        type: 'alert',
        title: 'Supplier Payables',
        message: `You owe PKR ${supplierPayablesTotal.toLocaleString()} to ${supplierPayablesCount} supplier(s).`,
        actionUrl: '/suppliers/manage',
        count: supplierPayablesCount
      });
    }

    // 4. Pending Diary Entries
    // Retrieve all active diary entries that are not deleted
    const activeDiaryEntries = await getDb().select({
      id: diary.id,
      customer_id: diary.customer_id,
      customer_name: diary.customer_name,
      phone: diary.phone,
      total_bill: diary.total_bill,
      amount_paid: diary.amount_paid,
      status: diary.status
    })
    .from(diary)
    .where(isNull(diary.deleted_at));

    // Calculate customer aggregated balances and identify genuine pending unpaid entries
    const customerDuesMap: Record<string, { totalBill: number; totalPaid: number; pendingCount: number }> = {};
    for (const entry of activeDiaryEntries) {
      // Exclude ledgered entries since they are permanently moved to official Khata
      if (entry.status === 'ledgered') continue;

      const key = `${(entry.customer_name || '').trim().toLowerCase()}_${(entry.phone || '').trim()}`;
      if (!customerDuesMap[key]) {
        customerDuesMap[key] = { totalBill: 0, totalPaid: 0, pendingCount: 0 };
      }
      customerDuesMap[key].totalBill += Number(entry.total_bill || 0);
      customerDuesMap[key].totalPaid += Number(entry.amount_paid || 0);
      
      // Count as a pending sale entry only if it has a non-zero bill and status is 'pending'
      if (entry.status === 'pending' && Number(entry.total_bill || 0) > 0) {
        customerDuesMap[key].pendingCount += 1;
      }
    }

    let pendingDiaryCount = 0;
    for (const cust of Object.values(customerDuesMap)) {
      // A customer has pending diary entries only if their total bills exceed their total payments (they owe money)
      // and they have pending bill entries
      if (cust.totalBill > cust.totalPaid && cust.pendingCount > 0) {
        pendingDiaryCount += cust.pendingCount;
      }
    }

    if (pendingDiaryCount > 0) {
      alerts.push({
        id: 'pending_diary',
        type: 'warning',
        title: 'Pending Diary Entries',
        message: `${pendingDiaryCount} Daily Diary entry/entries are pending and need to be cleared or sent to Khata.`,
        actionUrl: '/diary',
        count: pendingDiaryCount
      });
    }

    return alerts;
  }
}
