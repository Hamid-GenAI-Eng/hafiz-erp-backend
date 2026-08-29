CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_number" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"address" text,
	"status" text DEFAULT 'active',
	"balance" real DEFAULT 0 NOT NULL,
	"total_charged" real DEFAULT 0 NOT NULL,
	"total_paid" real DEFAULT 0 NOT NULL,
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "customers_customer_number_unique" UNIQUE("customer_number")
);
--> statement-breakpoint
CREATE TABLE "diary" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text,
	"customer_name" text NOT NULL,
	"phone" text,
	"date" text NOT NULL,
	"linked_note_id" text,
	"linked_note" text,
	"shipping" real DEFAULT 0 NOT NULL,
	"internal_shipping" real DEFAULT 0 NOT NULL,
	"total_bill" real DEFAULT 0 NOT NULL,
	"amount_paid" real DEFAULT 0 NOT NULL,
	"payments" text DEFAULT '[]',
	"status" text DEFAULT 'pending' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"device_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "diary_items" (
	"id" text PRIMARY KEY NOT NULL,
	"diary_id" text NOT NULL,
	"product_id" text,
	"description" text NOT NULL,
	"quantity" real DEFAULT 0 NOT NULL,
	"unit_price" real DEFAULT 0 NOT NULL,
	"discount" real DEFAULT 0 NOT NULL,
	"total_price" real DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"device_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diary_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"done" integer DEFAULT 0 NOT NULL,
	"date" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"device_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"product_id" text,
	"description" text NOT NULL,
	"quantity" real DEFAULT 1 NOT NULL,
	"unit_price" real DEFAULT 0 NOT NULL,
	"discount" real DEFAULT 0 NOT NULL,
	"total_price" real DEFAULT 0 NOT NULL,
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"customer_id" text,
	"walkin_name" text,
	"walkin_phone" text,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"due_date" text,
	"reference" text,
	"status" text DEFAULT 'active' NOT NULL,
	"subtotal" real DEFAULT 0 NOT NULL,
	"total_discount" real DEFAULT 0 NOT NULL,
	"shipping" real DEFAULT 0 NOT NULL,
	"internal_shipping" real DEFAULT 0 NOT NULL,
	"extra_discount" real DEFAULT 0 NOT NULL,
	"outside_loader_fee" real DEFAULT 0 NOT NULL,
	"grand_total" real DEFAULT 0 NOT NULL,
	"amount_paid" real DEFAULT 0 NOT NULL,
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "ledgers" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"invoice_id" text,
	"date" text NOT NULL,
	"time" text,
	"type" text NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"payment_amount" real DEFAULT 0 NOT NULL,
	"running_balance" real NOT NULL,
	"description" text NOT NULL,
	"method" text,
	"reference" text,
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "logistics_bucket_rentals" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_id" text,
	"vehicle_number" text,
	"vehicle_id" text,
	"material_type" text NOT NULL,
	"quantity_ft" real DEFAULT 0 NOT NULL,
	"price_per_ft" real DEFAULT 0 NOT NULL,
	"total_price" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Unpaid',
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "logistics_employees" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"phone" text,
	"monthly_salary" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active',
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "logistics_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"invoice_id" text,
	"date" text NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"type" text NOT NULL,
	"category" text,
	"description" text NOT NULL,
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "logistics_vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"plate_number" text NOT NULL,
	"ownership" text DEFAULT 'company',
	"status" text DEFAULT 'active',
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "misc_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"category" text NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"type" text DEFAULT 'expense' NOT NULL,
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"type" text NOT NULL,
	"category" text,
	"name" text NOT NULL,
	"brand" text,
	"size" text,
	"color" text,
	"location" text,
	"unit" text NOT NULL,
	"current_qty" real DEFAULT 0 NOT NULL,
	"cost_price" real DEFAULT 0 NOT NULL,
	"sale_price" real DEFAULT 0 NOT NULL,
	"min_alert" real DEFAULT 0 NOT NULL,
	"supplier_id" text,
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "supplier_ledgers" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"date" text NOT NULL,
	"time" text,
	"type" text NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"payment_amount" real DEFAULT 0 NOT NULL,
	"running_balance" real NOT NULL,
	"description" text NOT NULL,
	"method" text,
	"reference" text,
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_number" text NOT NULL,
	"company_name" text NOT NULL,
	"contact_person" text,
	"phone" text,
	"email" text,
	"address" text,
	"category" text DEFAULT 'Building',
	"tax_id" text,
	"status" text DEFAULT 'active',
	"balance_owed" real DEFAULT 0 NOT NULL,
	"total_purchased" real DEFAULT 0 NOT NULL,
	"total_paid" real DEFAULT 0 NOT NULL,
	"device_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "suppliers_supplier_number_unique" UNIQUE("supplier_number")
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"last_sync" timestamp NOT NULL,
	"status" text NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "diary_items" ADD CONSTRAINT "diary_items_diary_id_diary_id_fk" FOREIGN KEY ("diary_id") REFERENCES "public"."diary"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_bucket_rentals" ADD CONSTRAINT "logistics_bucket_rentals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_bucket_rentals" ADD CONSTRAINT "logistics_bucket_rentals_vehicle_id_logistics_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."logistics_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_expenses" ADD CONSTRAINT "logistics_expenses_vehicle_id_logistics_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."logistics_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_ledgers" ADD CONSTRAINT "supplier_ledgers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;