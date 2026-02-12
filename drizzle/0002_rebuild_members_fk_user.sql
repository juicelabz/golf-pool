PRAGMA foreign_keys=OFF;
--> statement-breakpoint

CREATE TABLE `members__new` (
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
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

INSERT INTO `members__new` (
	`id`,
	`name`,
	`user_id`,
	`total_points`,
	`segment1_points`,
	`segment2_points`,
	`segment3_points`,
	`segment4_points`,
	`segment5_points`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`name`,
	`user_id`,
	`total_points`,
	`segment1_points`,
	`segment2_points`,
	`segment3_points`,
	`segment4_points`,
	`segment5_points`,
	`created_at`,
	`updated_at`
FROM `members`;
--> statement-breakpoint

DROP TABLE `members`;
--> statement-breakpoint
ALTER TABLE `members__new` RENAME TO `members`;
--> statement-breakpoint

PRAGMA foreign_keys=ON;
