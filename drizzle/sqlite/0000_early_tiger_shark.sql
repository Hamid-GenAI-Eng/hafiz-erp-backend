CREATE TABLE IF NOT EXISTS `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_number` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`address` text,
	`status` text DEFAULT 'active',
	`balance` real DEFAULT 0 NOT NULL,
	`total_charged` real DEFAULT 0 NOT NULL,
	`total_paid` real DEFAULT 0 NOT NULL,
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `customers_customer_number_unique` ON `customers` (`customer_number`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `diary` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`customer_name` text NOT NULL,
	`phone` text,
	`date` text NOT NULL,
	`linked_note_id` text,
	`linked_note` text,
	`shipping` real DEFAULT 0 NOT NULL,
	`internal_shipping` real DEFAULT 0 NOT NULL,
	`total_bill` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`payments` text DEFAULT '[]',
	`status` text DEFAULT 'pending' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `diary_items` (
	`id` text PRIMARY KEY NOT NULL,
	`diary_id` text NOT NULL,
	`product_id` text,
	`description` text NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total_price` real DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`diary_id`) REFERENCES `diary`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `diary_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`date` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`product_id` text,
	`description` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total_price` real DEFAULT 0 NOT NULL,
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text NOT NULL,
	`customer_id` text,
	`walkin_name` text,
	`walkin_phone` text,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`due_date` text,
	`reference` text,
	`status` text DEFAULT 'active' NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`total_discount` real DEFAULT 0 NOT NULL,
	`shipping` real DEFAULT 0 NOT NULL,
	`internal_shipping` real DEFAULT 0 NOT NULL,
	`extra_discount` real DEFAULT 0 NOT NULL,
	`outside_loader_fee` real DEFAULT 0 NOT NULL,
	`grand_total` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ledgers` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`invoice_id` text,
	`date` text NOT NULL,
	`time` text,
	`type` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`payment_amount` real DEFAULT 0 NOT NULL,
	`running_balance` real NOT NULL,
	`description` text NOT NULL,
	`method` text,
	`reference` text,
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `logistics_bucket_rentals` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_id` text,
	`vehicle_number` text,
	`vehicle_id` text,
	`material_type` text NOT NULL,
	`quantity_ft` real DEFAULT 0 NOT NULL,
	`price_per_ft` real DEFAULT 0 NOT NULL,
	`total_price` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Unpaid',
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehicle_id`) REFERENCES `logistics_vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `logistics_employees` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`phone` text,
	`monthly_salary` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active',
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `logistics_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`invoice_id` text,
	`date` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`type` text NOT NULL,
	`category` text,
	`description` text NOT NULL,
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`vehicle_id`) REFERENCES `logistics_vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `logistics_vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`plate_number` text NOT NULL,
	`ownership` text DEFAULT 'company',
	`status` text DEFAULT 'active',
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `misc_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`category` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`description` text NOT NULL,
	`type` text DEFAULT 'expense' NOT NULL,
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `products` (
	`id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`type` text NOT NULL,
	`category` text,
	`name` text NOT NULL,
	`brand` text,
	`size` text,
	`color` text,
	`location` text,
	`unit` text NOT NULL,
	`current_qty` real DEFAULT 0 NOT NULL,
	`cost_price` real DEFAULT 0 NOT NULL,
	`sale_price` real DEFAULT 0 NOT NULL,
	`min_alert` real DEFAULT 0 NOT NULL,
	`supplier_id` text,
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `supplier_ledgers` (
	`id` text PRIMARY KEY NOT NULL,
	`supplier_id` text NOT NULL,
	`date` text NOT NULL,
	`time` text,
	`type` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`payment_amount` real DEFAULT 0 NOT NULL,
	`running_balance` real NOT NULL,
	`description` text NOT NULL,
	`method` text,
	`reference` text,
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`supplier_number` text NOT NULL,
	`company_name` text NOT NULL,
	`contact_person` text,
	`phone` text,
	`email` text,
	`address` text,
	`category` text DEFAULT 'Building',
	`tax_id` text,
	`status` text DEFAULT 'active',
	`balance_owed` real DEFAULT 0 NOT NULL,
	`total_purchased` real DEFAULT 0 NOT NULL,
	`total_paid` real DEFAULT 0 NOT NULL,
	`device_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `suppliers_supplier_number_unique` ON `suppliers` (`supplier_number`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sync_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`last_sync` integer NOT NULL,
	`status` text NOT NULL,
	`error` text
);
