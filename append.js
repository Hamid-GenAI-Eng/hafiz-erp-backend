const fs = require('fs');
const path = 'src/models/schema.ts';

const newTables = \
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
\;

fs.appendFileSync(path, '\n' + newTables);
console.log('Appended schemas.');
