CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`consumed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_hash_unique` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `execution_records` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`session_id` text NOT NULL,
	`capability_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`status` text DEFAULT 'ACCEPTED' NOT NULL,
	`input_json` text NOT NULL,
	`result_json` text,
	`error_code` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `execution_records_actor_capability_idempotency_uq` ON `execution_records` (`actor_id`,`capability_id`,`idempotency_key`);--> statement-breakpoint
CREATE TABLE `aep_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`resume_token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`replay_until` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`is_revoked` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `aep_sessions_resume_token_hash_unique` ON `aep_sessions` (`resume_token_hash`);