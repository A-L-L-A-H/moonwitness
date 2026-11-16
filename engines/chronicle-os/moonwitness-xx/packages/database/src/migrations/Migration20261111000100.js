import { Migration } from "@mikro-orm/migrations";

export class Migration20261111000100 extends Migration {
  async up() {
    this.addSql(`
      create table if not exists "users" (
        "id" uuid primary key default gen_random_uuid(),
        "handle" varchar(48) not null unique,
        "display_name" varchar(120) not null,
        "email" varchar(254) unique,
        "status" varchar(24) not null default 'active',
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now()
      )
    `);

    this.addSql(`
      create table if not exists "stories" (
        "id" uuid primary key default gen_random_uuid(),
        "author_id" uuid not null references "users" ("id") on delete restrict,
        "slug" varchar(180) not null unique,
        "title" varchar(240) not null,
        "subtitle" varchar(500),
        "status" varchar(32) not null default 'draft',
        "content_blocks" jsonb not null default '[]'::jsonb,
        "published_at" timestamptz,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now()
      )
    `);

    this.addSql('create index if not exists "stories_status_published_at_idx" on "stories" ("status", "published_at")');
    this.addSql('create index if not exists "stories_author_created_at_idx" on "stories" ("author_id", "created_at")');

    this.addSql(`
      create table if not exists "addon_installations" (
        "id" uuid primary key default gen_random_uuid(),
        "addon_id" varchar(120) not null unique,
        "version" varchar(40) not null,
        "state" varchar(24) not null default 'installed',
        "config" jsonb not null default '{}'::jsonb,
        "installed_at" timestamptz not null default now(),
        "enabled_at" timestamptz,
        "disabled_at" timestamptz,
        "last_error" varchar(2000),
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now()
      )
    `);

    this.addSql(`
      create table if not exists "audit_events" (
        "id" uuid primary key default gen_random_uuid(),
        "actor_user_id" uuid references "users" ("id") on delete set null,
        "action" varchar(120) not null,
        "subject_type" varchar(80) not null,
        "subject_id" varchar(180) not null,
        "request_id" varchar(120),
        "metadata" jsonb not null default '{}'::jsonb,
        "created_at" timestamptz not null default now()
      )
    `);

    this.addSql('create index if not exists "audit_events_subject_created_idx" on "audit_events" ("subject_type", "subject_id", "created_at")');
    this.addSql('create index if not exists "audit_events_actor_created_idx" on "audit_events" ("actor_user_id", "created_at")');
  }

  async down() {
    this.addSql('drop table if exists "audit_events" cascade');
    this.addSql('drop table if exists "addon_installations" cascade');
    this.addSql('drop table if exists "stories" cascade');
    this.addSql('drop table if exists "users" cascade');
  }
}
