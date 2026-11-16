import { Migration } from "@mikro-orm/migrations";

export class Migration20261111000500 extends Migration {
  async up() {
    this.addSql(`create table "outbox_messages" (
      "id" uuid primary key default gen_random_uuid(),
      "event_type" varchar(120) not null,
      "schema_version" integer not null default 1,
      "payload" jsonb not null,
      "correlation_id" varchar(120) not null,
      "idempotency_key" varchar(240) unique,
      "status" varchar(24) not null default 'pending',
      "attempts" integer not null default 0,
      "available_at" timestamptz not null default now(),
      "locked_until" timestamptz,
      "locked_by" varchar(120),
      "last_error" varchar(2000),
      "dispatched_at" timestamptz,
      "processed_at" timestamptz,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now()
    )`);
    this.addSql('create index "outbox_status_available_created_idx" on "outbox_messages" ("status", "available_at", "created_at")');
    this.addSql('create index "outbox_status_locked_until_idx" on "outbox_messages" ("status", "locked_until")');
  }

  async down() {
    this.addSql('drop table if exists "outbox_messages" cascade');
  }
}
