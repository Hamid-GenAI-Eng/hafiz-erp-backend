import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(), // UUID
  customer_number: text('customer_number').notNull().unique(), // e.g. CUST-1001 or TMP-ABC12
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  status: text('status').default('active'), // 'active' or 'inactive'
  
  // Sync Cache columns
  balance: real('balance').default(0).notNull(),
  total_charged: real('total_charged').default(0).notNull(),
  total_paid: real('total_paid').default(0).notNull(),

  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' }) // Soft delete
});

export const ledgers = sqliteTable('ledgers', {
  id: text('id').primaryKey(), // UUID
  customer_id: text('customer_id').notNull().references(() => customers.id),
  invoice_id: text('invoice_id'), // Nullable FK to future invoices table
  
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time'),
  type: text('type').notNull(), // 'charge' or 'payment'
  
  amount: real('amount').default(0).notNull(), // Debit
  payment_amount: real('payment_amount').default(0).notNull(), // Credit
  running_balance: real('running_balance').notNull(), // Snapshot
  
  description: text('description').notNull(),
  method: text('method'),
  reference: text('reference'),

  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' }) // Soft delete
});

export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(), // UUID
  supplier_number: text('supplier_number').notNull().unique(), // e.g. SUPP-1001 or TMP-ABC12
  company_name: text('company_name').notNull(),
  contact_person: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  category: text('category').default('Building'), // Building, Sanitary, Both, Other
  tax_id: text('tax_id'),
  status: text('status').default('active'), // 'active' or 'inactive'
  
  // Sync Cache columns
  balance_owed: real('balance_owed').default(0).notNull(),
  total_purchased: real('total_purchased').default(0).notNull(),
  total_paid: real('total_paid').default(0).notNull(),

  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' }) // Soft delete
});

export const supplier_ledgers = sqliteTable('supplier_ledgers', {
  id: text('id').primaryKey(), // UUID
  supplier_id: text('supplier_id').notNull().references(() => suppliers.id),
  
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time'),
  type: text('type').notNull(), // 'purchase' or 'payment'
  
  amount: real('amount').default(0).notNull(), // Debit (Purchase Amount)
  payment_amount: real('payment_amount').default(0).notNull(), // Credit (Payment Made)
  running_balance: real('running_balance').notNull(), // Snapshot
  
  description: text('description').notNull(),
  method: text('method'),
  reference: text('reference'),

  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' }) // Soft delete
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(), // UUID
  sku: text('sku').notNull().unique(), // Auto-generated SKU
  type: text('type').notNull(), // 'building' or 'sanitary'
  category: text('category'),
  name: text('name').notNull(),
  brand: text('brand'),
  size: text('size'),
  color: text('color'),
  location: text('location'),
  unit: text('unit').notNull(),
  
  current_qty: real('current_qty').default(0).notNull(),
  cost_price: real('cost_price').default(0).notNull(),
  sale_price: real('sale_price').default(0).notNull(),
  min_alert: real('min_alert').default(0).notNull(),
  
  supplier_id: text('supplier_id').references(() => suppliers.id),
  
  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' }) // Soft delete
});

// ==========================================
// LOGISTICS & SETTINGS MODULE
// ==========================================

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(), // UUID
  key: text('key').notNull().unique(),
  value: text('value').notNull(),

  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' })
});

export const logistics_vehicles = sqliteTable('logistics_vehicles', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  plate_number: text('plate_number').notNull(),
  ownership: text('ownership').default('company'), // company, hired
  status: text('status').default('active'),
  
  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' })
});

export const logistics_employees = sqliteTable('logistics_employees', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  role: text('role').notNull(), // driver, helper
  phone: text('phone'),
  monthly_salary: real('monthly_salary').default(0).notNull(),
  status: text('status').default('active'),
  
  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' })
});

export const logistics_expenses = sqliteTable('logistics_expenses', {
  id: text('id').primaryKey(), // UUID
  vehicle_id: text('vehicle_id').notNull().references(() => logistics_vehicles.id),
  invoice_id: text('invoice_id'), // Nullable FK to invoices for traceability
  date: text('date').notNull(),
  amount: real('amount').default(0).notNull(),
  type: text('type').notNull(), // income, expense
  category: text('category'),
  description: text('description').notNull(),
  
  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' })
});

export const logistics_bucket_rentals = sqliteTable('logistics_bucket_rentals', {
  id: text('id').primaryKey(), // UUID
  date: text('date').notNull(),
  time: text('time').notNull(),
  customer_name: text('customer_name').notNull(),
  customer_id: text('customer_id').references(() => customers.id), // Optional FK to CRM
  vehicle_number: text('vehicle_number'), // customer's truck plate
  vehicle_id: text('vehicle_id').references(() => logistics_vehicles.id), // optional tractor that filled it
  material_type: text('material_type').notNull(),
  quantity_ft: real('quantity_ft').default(0).notNull(),
  price_per_ft: real('price_per_ft').default(0).notNull(),
  total_price: real('total_price').default(0).notNull(),
  status: text('status').default('Unpaid'),
  
  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' })
});

export const misc_expenses = sqliteTable('misc_expenses', {
  id: text('id').primaryKey(), // UUID
  date: text('date').notNull(),
  time: text('time').notNull(),
  category: text('category').notNull(),
  amount: real('amount').default(0).notNull(),
  description: text('description').notNull(),
  type: text('type').default('expense').notNull(),
  
  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' })
});

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(), // UUID
  invoice_number: text('invoice_number').notNull().unique(), // e.g. INV-1001 or TMP-ABC
  customer_id: text('customer_id').references(() => customers.id), // Nullable for walk-ins
  walkin_name: text('walkin_name'),
  walkin_phone: text('walkin_phone'),
  
  date: text('date').notNull(),
  time: text('time').notNull(),
  due_date: text('due_date'),
  reference: text('reference'),
  status: text('status').default('active').notNull(), // 'active', 'Draft', 'cancelled'
  
  subtotal: real('subtotal').default(0).notNull(),
  total_discount: real('total_discount').default(0).notNull(),
  shipping: real('shipping').default(0).notNull(),
  internal_shipping: real('internal_shipping').default(0).notNull(),
  extra_discount: real('extra_discount').default(0).notNull(),
  outside_loader_fee: real('outside_loader_fee').default(0).notNull(),
  grand_total: real('grand_total').default(0).notNull(),
  amount_paid: real('amount_paid').default(0).notNull(),
  
  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' })
});

export const invoice_items = sqliteTable('invoice_items', {
  id: text('id').primaryKey(), // UUID
  invoice_id: text('invoice_id').notNull().references(() => invoices.id),
  product_id: text('product_id').references(() => products.id), // Nullable for custom items
  
  description: text('description').notNull(),
  quantity: real('quantity').default(1).notNull(),
  unit_price: real('unit_price').default(0).notNull(),
  discount: real('discount').default(0).notNull(),
  total_price: real('total_price').default(0).notNull(),
  
  // Sync Metadata
  device_id: text('device_id'),
  version: integer('version').default(1).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' })
});

export const diary = sqliteTable('diary', {
  id: text('id').primaryKey(),
  customer_id: text('customer_id'),
  customer_name: text('customer_name').notNull(),
  phone: text('phone'),
  date: text('date').notNull(),
  linked_note_id: text('linked_note_id'),
  linked_note: text('linked_note'),
  shipping: real('shipping').notNull().default(0),
  internal_shipping: real('internal_shipping').notNull().default(0),
  total_bill: real('total_bill').notNull().default(0),
  amount_paid: real('amount_paid').notNull().default(0),
  payments: text('payments').default('[]'),
  status: text('status').notNull().default('pending'),
  version: integer('version').notNull().default(1),
  device_id: text('device_id'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deleted_at: integer('deleted_at', { mode: 'timestamp' }),
});

export const diary_items = sqliteTable('diary_items', {
  id: text('id').primaryKey(),
  diary_id: text('diary_id').references(() => diary.id).notNull(),
  product_id: text('product_id'),
  description: text('description').notNull(),
  quantity: real('quantity').notNull().default(0),
  unit_price: real('unit_price').notNull().default(0),
  discount: real('discount').notNull().default(0),
  total_price: real('total_price').notNull().default(0),
  version: integer('version').notNull().default(1),
  device_id: text('device_id'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const diary_notes = sqliteTable('diary_notes', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  done: integer('done').notNull().default(0),
  date: text('date').notNull(),
  version: integer('version').notNull().default(1),
  device_id: text('device_id'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
