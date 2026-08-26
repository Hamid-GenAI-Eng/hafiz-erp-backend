import { db } from '../config/database';
import { products, customers, suppliers, diary } from '../models/schema';
import { sql, eq } from 'drizzle-orm';

export class NotificationService {
  static async getAlerts() {
    const alerts: any[] = [];

    // 1. Low Stock Alerts
    const lowStockQuery = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(products)
    .where(sql`${products.current_qty} <= ${products.min_alert}`);

    const lowStockCount = lowStockQuery[0]?.count || 0;
    if (lowStockCount > 0) {
      alerts.push({
        id: 'low_stock',
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${lowStockCount} product(s) have reached or dropped below their minimum stock alert level.`,
        actionUrl: '/products/manage',
        count: lowStockCount
      });
    }

    // 2. Customer Dues
    const customerDuesQuery = await db.select({
      count: sql<number>`COUNT(*)`,
      total: sql<number>`SUM(${customers.balance})`
    })
    .from(customers)
    .where(sql`${customers.balance} > 0`);

    const customerDuesCount = customerDuesQuery[0]?.count || 0;
    const customerDuesTotal = customerDuesQuery[0]?.total || 0;
    
    if (customerDuesCount > 0) {
      alerts.push({
        id: 'customer_dues',
        type: 'info',
        title: 'Customer Dues',
        message: `${customerDuesCount} customer(s) have outstanding dues totaling PKR ${customerDuesTotal.toLocaleString()}.`,
        actionUrl: '/customers/manage',
        count: customerDuesCount
      });
    }

    // 3. Supplier Payables
    const supplierPayablesQuery = await db.select({
      count: sql<number>`COUNT(*)`,
      total: sql<number>`SUM(${suppliers.balance_owed})`
    })
    .from(suppliers)
    .where(sql`${suppliers.balance_owed} > 0`);

    const supplierPayablesCount = supplierPayablesQuery[0]?.count || 0;
    const supplierPayablesTotal = supplierPayablesQuery[0]?.total || 0;

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
    const pendingDiaryQuery = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(diary)
    .where(eq(diary.status, 'pending'));

    const pendingDiaryCount = pendingDiaryQuery[0]?.count || 0;

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
