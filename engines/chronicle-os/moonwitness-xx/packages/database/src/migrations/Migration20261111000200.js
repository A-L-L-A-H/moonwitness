import { Migration } from "@mikro-orm/migrations";

export class Migration20261111000200 extends Migration {
  async up() {
    this.addSql('alter table "users" add column "password_hash" varchar(255) not null default \'\'');
    this.addSql('alter table "users" alter column "password_hash" drop default');

    this.addSql(`
      create table "user_sessions" (
        "id" uuid primary key default gen_random_uuid(),
        "user_id" uuid not null references "users" ("id") on delete cascade,
        "token_hash" varchar(64) not null unique,
        "csrf_token_hash" varchar(64) not null,
        "expires_at" timestamptz not null,
        "revoked_at" timestamptz,
        "last_used_at" timestamptz,
        "created_at" timestamptz not null default now()
      )
    `);

    this.addSql('create index "user_sessions_user_expiry_idx" on "user_sessions" ("user_id", "expires_at")');
    this.addSql('create index "user_sessions_revoked_expiry_idx" on "user_sessions" ("revoked_at", "expires_at")');
  }

  async down() {
    this.addSql('drop table if exists "user_sessions" cascade');
    this.addSql('alter table "users" drop column if exists "password_hash"');
  }
}
