"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoice_items = exports.invoices = exports.misc_expenses = exports.logistics_bucket_rentals = exports.logistics_expenses = exports.logistics_employees = exports.logistics_vehicles = exports.settings = exports.products = exports.supplier_ledgers = exports.suppliers = exports.ledgers = exports.customers = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.customers = (0, sqlite_core_1.sqliteTable)('customers', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    customer_number: (0, sqlite_core_1.text)('customer_number').notNull().unique(), // e.g. CUST-1001 or TMP-ABC12
    name: (0, sqlite_core_1.text)('name').notNull(),
    phone: (0, sqlite_core_1.text)('phone'),
    address: (0, sqlite_core_1.text)('address'),
    status: (0, sqlite_core_1.text)('status').default('active'), // 'active' or 'inactive'
    // Sync Cache columns
    balance: (0, sqlite_core_1.real)('balance').default(0).notNull(),
    total_charged: (0, sqlite_core_1.real)('total_charged').default(0).notNull(),
    total_paid: (0, sqlite_core_1.real)('total_paid').default(0).notNull(),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' }) // Soft delete
});
exports.ledgers = (0, sqlite_core_1.sqliteTable)('ledgers', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    customer_id: (0, sqlite_core_1.text)('customer_id').notNull().references(() => exports.customers.id),
    invoice_id: (0, sqlite_core_1.text)('invoice_id'), // Nullable FK to future invoices table
    date: (0, sqlite_core_1.text)('date').notNull(), // YYYY-MM-DD
    time: (0, sqlite_core_1.text)('time'),
    type: (0, sqlite_core_1.text)('type').notNull(), // 'charge' or 'payment'
    amount: (0, sqlite_core_1.real)('amount').default(0).notNull(), // Debit
    payment_amount: (0, sqlite_core_1.real)('payment_amount').default(0).notNull(), // Credit
    running_balance: (0, sqlite_core_1.real)('running_balance').notNull(), // Snapshot
    description: (0, sqlite_core_1.text)('description').notNull(),
    method: (0, sqlite_core_1.text)('method'),
    reference: (0, sqlite_core_1.text)('reference'),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' }) // Soft delete
});
exports.suppliers = (0, sqlite_core_1.sqliteTable)('suppliers', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    supplier_number: (0, sqlite_core_1.text)('supplier_number').notNull().unique(), // e.g. SUPP-1001 or TMP-ABC12
    company_name: (0, sqlite_core_1.text)('company_name').notNull(),
    contact_person: (0, sqlite_core_1.text)('contact_person'),
    phone: (0, sqlite_core_1.text)('phone'),
    email: (0, sqlite_core_1.text)('email'),
    address: (0, sqlite_core_1.text)('address'),
    category: (0, sqlite_core_1.text)('category').default('Building'), // Building, Sanitary, Both, Other
    tax_id: (0, sqlite_core_1.text)('tax_id'),
    status: (0, sqlite_core_1.text)('status').default('active'), // 'active' or 'inactive'
    // Sync Cache columns
    balance_owed: (0, sqlite_core_1.real)('balance_owed').default(0).notNull(),
    total_purchased: (0, sqlite_core_1.real)('total_purchased').default(0).notNull(),
    total_paid: (0, sqlite_core_1.real)('total_paid').default(0).notNull(),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' }) // Soft delete
});
exports.supplier_ledgers = (0, sqlite_core_1.sqliteTable)('supplier_ledgers', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    supplier_id: (0, sqlite_core_1.text)('supplier_id').notNull().references(() => exports.suppliers.id),
    date: (0, sqlite_core_1.text)('date').notNull(), // YYYY-MM-DD
    time: (0, sqlite_core_1.text)('time'),
    type: (0, sqlite_core_1.text)('type').notNull(), // 'purchase' or 'payment'
    amount: (0, sqlite_core_1.real)('amount').default(0).notNull(), // Debit (Purchase Amount)
    payment_amount: (0, sqlite_core_1.real)('payment_amount').default(0).notNull(), // Credit (Payment Made)
    running_balance: (0, sqlite_core_1.real)('running_balance').notNull(), // Snapshot
    description: (0, sqlite_core_1.text)('description').notNull(),
    method: (0, sqlite_core_1.text)('method'),
    reference: (0, sqlite_core_1.text)('reference'),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' }) // Soft delete
});
exports.products = (0, sqlite_core_1.sqliteTable)('products', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    sku: (0, sqlite_core_1.text)('sku').notNull().unique(), // Auto-generated SKU
    type: (0, sqlite_core_1.text)('type').notNull(), // 'building' or 'sanitary'
    category: (0, sqlite_core_1.text)('category'),
    name: (0, sqlite_core_1.text)('name').notNull(),
    brand: (0, sqlite_core_1.text)('brand'),
    size: (0, sqlite_core_1.text)('size'),
    color: (0, sqlite_core_1.text)('color'),
    location: (0, sqlite_core_1.text)('location'),
    unit: (0, sqlite_core_1.text)('unit').notNull(),
    current_qty: (0, sqlite_core_1.real)('current_qty').default(0).notNull(),
    cost_price: (0, sqlite_core_1.real)('cost_price').default(0).notNull(),
    sale_price: (0, sqlite_core_1.real)('sale_price').default(0).notNull(),
    min_alert: (0, sqlite_core_1.real)('min_alert').default(0).notNull(),
    supplier_id: (0, sqlite_core_1.text)('supplier_id').references(() => exports.suppliers.id),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' }) // Soft delete
});
// ==========================================
// LOGISTICS & SETTINGS MODULE
// ==========================================
exports.settings = (0, sqlite_core_1.sqliteTable)('settings', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    key: (0, sqlite_core_1.text)('key').notNull().unique(),
    value: (0, sqlite_core_1.text)('value').notNull(),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' })
});
exports.logistics_vehicles = (0, sqlite_core_1.sqliteTable)('logistics_vehicles', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    name: (0, sqlite_core_1.text)('name').notNull(),
    plate_number: (0, sqlite_core_1.text)('plate_number').notNull(),
    ownership: (0, sqlite_core_1.text)('ownership').default('company'), // company, hired
    status: (0, sqlite_core_1.text)('status').default('active'),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' })
});
exports.logistics_employees = (0, sqlite_core_1.sqliteTable)('logistics_employees', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    name: (0, sqlite_core_1.text)('name').notNull(),
    role: (0, sqlite_core_1.text)('role').notNull(), // driver, helper
    phone: (0, sqlite_core_1.text)('phone'),
    monthly_salary: (0, sqlite_core_1.real)('monthly_salary').default(0).notNull(),
    status: (0, sqlite_core_1.text)('status').default('active'),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' })
});
exports.logistics_expenses = (0, sqlite_core_1.sqliteTable)('logistics_expenses', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    vehicle_id: (0, sqlite_core_1.text)('vehicle_id').notNull().references(() => exports.logistics_vehicles.id),
    invoice_id: (0, sqlite_core_1.text)('invoice_id'), // Nullable FK to invoices for traceability
    date: (0, sqlite_core_1.text)('date').notNull(),
    amount: (0, sqlite_core_1.real)('amount').default(0).notNull(),
    type: (0, sqlite_core_1.text)('type').notNull(), // income, expense
    category: (0, sqlite_core_1.text)('category'),
    description: (0, sqlite_core_1.text)('description').notNull(),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' })
});
exports.logistics_bucket_rentals = (0, sqlite_core_1.sqliteTable)('logistics_bucket_rentals', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    date: (0, sqlite_core_1.text)('date').notNull(),
    time: (0, sqlite_core_1.text)('time').notNull(),
    customer_name: (0, sqlite_core_1.text)('customer_name').notNull(),
    customer_id: (0, sqlite_core_1.text)('customer_id').references(() => exports.customers.id), // Optional FK to CRM
    vehicle_number: (0, sqlite_core_1.text)('vehicle_number'), // customer's truck plate
    vehicle_id: (0, sqlite_core_1.text)('vehicle_id').references(() => exports.logistics_vehicles.id), // optional tractor that filled it
    material_type: (0, sqlite_core_1.text)('material_type').notNull(),
    quantity_ft: (0, sqlite_core_1.real)('quantity_ft').default(0).notNull(),
    price_per_ft: (0, sqlite_core_1.real)('price_per_ft').default(0).notNull(),
    total_price: (0, sqlite_core_1.real)('total_price').default(0).notNull(),
    status: (0, sqlite_core_1.text)('status').default('Unpaid'),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' })
});
exports.misc_expenses = (0, sqlite_core_1.sqliteTable)('misc_expenses', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    date: (0, sqlite_core_1.text)('date').notNull(),
    time: (0, sqlite_core_1.text)('time').notNull(),
    category: (0, sqlite_core_1.text)('category').notNull(),
    amount: (0, sqlite_core_1.real)('amount').default(0).notNull(),
    description: (0, sqlite_core_1.text)('description').notNull(),
    type: (0, sqlite_core_1.text)('type').default('expense').notNull(),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' })
});
exports.invoices = (0, sqlite_core_1.sqliteTable)('invoices', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    invoice_number: (0, sqlite_core_1.text)('invoice_number').notNull().unique(), // e.g. INV-1001 or TMP-ABC
    customer_id: (0, sqlite_core_1.text)('customer_id').references(() => exports.customers.id), // Nullable for walk-ins
    walkin_name: (0, sqlite_core_1.text)('walkin_name'),
    walkin_phone: (0, sqlite_core_1.text)('walkin_phone'),
    date: (0, sqlite_core_1.text)('date').notNull(),
    time: (0, sqlite_core_1.text)('time').notNull(),
    due_date: (0, sqlite_core_1.text)('due_date'),
    reference: (0, sqlite_core_1.text)('reference'),
    status: (0, sqlite_core_1.text)('status').default('active').notNull(), // 'active', 'Draft', 'cancelled'
    subtotal: (0, sqlite_core_1.real)('subtotal').default(0).notNull(),
    total_discount: (0, sqlite_core_1.real)('total_discount').default(0).notNull(),
    shipping: (0, sqlite_core_1.real)('shipping').default(0).notNull(),
    internal_shipping: (0, sqlite_core_1.real)('internal_shipping').default(0).notNull(),
    extra_discount: (0, sqlite_core_1.real)('extra_discount').default(0).notNull(),
    outside_loader_fee: (0, sqlite_core_1.real)('outside_loader_fee').default(0).notNull(),
    grand_total: (0, sqlite_core_1.real)('grand_total').default(0).notNull(),
    amount_paid: (0, sqlite_core_1.real)('amount_paid').default(0).notNull(),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' })
});
exports.invoice_items = (0, sqlite_core_1.sqliteTable)('invoice_items', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    invoice_id: (0, sqlite_core_1.text)('invoice_id').notNull().references(() => exports.invoices.id),
    product_id: (0, sqlite_core_1.text)('product_id').references(() => exports.products.id), // Nullable for custom items
    description: (0, sqlite_core_1.text)('description').notNull(),
    quantity: (0, sqlite_core_1.real)('quantity').default(1).notNull(),
    unit_price: (0, sqlite_core_1.real)('unit_price').default(0).notNull(),
    discount: (0, sqlite_core_1.real)('discount').default(0).notNull(),
    total_price: (0, sqlite_core_1.real)('total_price').default(0).notNull(),
    // Sync Metadata
    device_id: (0, sqlite_core_1.text)('device_id'),
    version: (0, sqlite_core_1.integer)('version').default(1).notNull(),
    created_at: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updated_at: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
    deleted_at: (0, sqlite_core_1.integer)('deleted_at', { mode: 'timestamp' })
});
