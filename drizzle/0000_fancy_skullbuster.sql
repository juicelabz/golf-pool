CREATE TABLE `golfers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` integer NOT NULL,
	`is_eligible` integer DEFAULT true NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text,
	`total_points` integer DEFAULT 0 NOT NULL,
	`segment1_points` integer DEFAULT 0 NOT NULL,
	`segment2_points` integer DEFAULT 0 NOT NULL,
	`segment3_points` integer DEFAULT 0 NOT NULL,
	`segment4_points` integer DEFAULT 0 NOT NULL,
	`segment5_points` integer DEFAULT 0 NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rosters` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`golfer_id` text NOT NULL,
	`category` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`golfer_id`) REFERENCES `golfers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scoring` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`golfer_id` text NOT NULL,
	`rank` integer NOT NULL,
	`points` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`golfer_id`) REFERENCES `golfers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`segment` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`firstName` text,
	`lastName` text,
	`role` text DEFAULT 'user' NOT NULL,
	`isPaid` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);