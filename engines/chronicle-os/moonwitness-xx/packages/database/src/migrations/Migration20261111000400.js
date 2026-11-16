import { Migration } from "@mikro-orm/migrations";

export class Migration20261111000400 extends Migration {
  async up() {
    this.addSql(`create table "roles" (
      "id" uuid primary key default gen_random_uuid(),
      "name" varchar(64) not null unique,
      "description" varchar(500) not null,
      "is_system" boolean not null default true,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now()
    )`);

    this.addSql(`create table "role_permissions" (
      "id" uuid primary key default gen_random_uuid(),
      "role_id" uuid not null references "roles" ("id") on delete cascade,
      "permission" varchar(120) not null,
      "created_at" timestamptz not null default now(),
      constraint "role_permissions_unique" unique ("role_id", "permission")
    )`);

    this.addSql(`create table "user_roles" (
      "id" uuid primary key default gen_random_uuid(),
      "user_id" uuid not null references "users" ("id") on delete cascade,
      "role_id" uuid not null references "roles" ("id") on delete restrict,
      "granted_by" uuid references "users" ("id") on delete set null,
      "granted_at" timestamptz not null default now(),
      constraint "user_roles_unique" unique ("user_id", "role_id")
    )`);
    this.addSql('create index "user_roles_role_granted_idx" on "user_roles" ("role_id", "granted_at")');

    this.addSql(`create table "addon_capability_grants" (
      "id" uuid primary key default gen_random_uuid(),
      "addon_id" varchar(120) not null,
      "permission" varchar(120) not null,
      "granted_by" uuid references "users" ("id") on delete set null,
      "granted_at" timestamptz not null default now(),
      "revoked_at" timestamptz,
      constraint "addon_capability_grants_unique" unique ("addon_id", "permission", "revoked_at")
    )`);
    this.addSql('create index "addon_capability_grants_active_idx" on "addon_capability_grants" ("addon_id", "revoked_at")');
  }

  async down() {
    this.addSql('drop table if exists "addon_capability_grants" cascade');
    this.addSql('drop table if exists "user_roles" cascade');
    this.addSql('drop table if exists "role_permissions" cascade');
    this.addSql('drop table if exists "roles" cascade');
  }
}
