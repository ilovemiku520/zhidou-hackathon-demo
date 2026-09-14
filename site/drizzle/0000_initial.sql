CREATE TABLE `market` (
	`id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `operations` (
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`payload` text NOT NULL,
	`receipt` text NOT NULL,
	`expected` integer NOT NULL,
	`market_expected` integer NOT NULL,
	`next_state` text,
	`next_market` text,
	`created` integer NOT NULL,
	PRIMARY KEY(`user_id`, `key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `operations_user_created` ON `operations` (`user_id`,`created`);--> statement-breakpoint
CREATE TABLE `orders` (
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`day` text NOT NULL,
	`qty` integer NOT NULL,
	`receipt` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`user_id`, `key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `orders_day` ON `orders` (`day`);--> statement-breakpoint
CREATE INDEX `orders_user_created` ON `orders` (`user_id`,`created`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`day` text PRIMARY KEY NOT NULL,
	`rate` text NOT NULL,
	`epsilon` integer NOT NULL,
	`synthetic` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `redemptions` (
	`user_id` text NOT NULL,
	`campaign` text NOT NULL,
	`fish` integer NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`user_id`, `campaign`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`csrf` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sessions_expiry` ON `sessions` (`expires`);--> statement-breakpoint
CREATE TABLE `throttles` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `throttles_expiry` ON `throttles` (`expires`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`soft` integer NOT NULL,
	`fish` integer NOT NULL,
	`held` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_name_unique` ON `users` (`name`);
--> statement-breakpoint
