import { Migration } from "@mikro-orm/migrations";

export class Migration20261111000300 extends Migration {
  async up() {
    this.addSql(`
      create table "source_references" (
        "id" uuid primary key default gen_random_uuid(),
        "created_by" uuid references "users" ("id") on delete set null,
        "title" varchar(500) not null,
        "url" varchar(2048) not null,
        "normalized_url" varchar(2048) not null unique,
        "author_name" varchar(240),
        "publisher" varchar(240),
        "source_type" varchar(40) not null default 'external',
        "accessed_at" timestamptz,
        "metadata" jsonb not null default '{}'::jsonb,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now()
      )
    `);
    this.addSql('create index "source_references_creator_created_idx" on "source_references" ("created_by", "created_at")');

    this.addSql(`
      create table "story_block_sources" (
        "id" uuid primary key default gen_random_uuid(),
        "story_id" uuid not null references "stories" ("id") on delete cascade,
        "source_reference_id" uuid not null references "source_references" ("id") on delete restrict,
        "block_id" varchar(80) not null,
        "created_at" timestamptz not null default now(),
        constraint "story_block_sources_unique" unique ("story_id", "block_id", "source_reference_id")
      )
    `);

    this.addSql(`
      create table "research_dossiers" (
        "id" uuid primary key default gen_random_uuid(),
        "author_id" uuid not null references "users" ("id") on delete restrict,
        "slug" varchar(180) not null unique,
        "title" varchar(240) not null,
        "question" varchar(2000) not null,
        "scope" varchar(5000) not null,
        "methodology_note" varchar(10000),
        "status" varchar(32) not null default 'draft',
        "findings" jsonb not null default '[]'::jsonb,
        "limitations" jsonb not null default '[]'::jsonb,
        "next_questions" jsonb not null default '[]'::jsonb,
        "published_at" timestamptz,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now()
      )
    `);
    this.addSql('create index "research_dossiers_status_published_idx" on "research_dossiers" ("status", "published_at")');
    this.addSql('create index "research_dossiers_author_created_idx" on "research_dossiers" ("author_id", "created_at")');

    this.addSql(`
      create table "research_claims" (
        "id" uuid primary key default gen_random_uuid(),
        "dossier_id" uuid not null references "research_dossiers" ("id") on delete cascade,
        "statement" varchar(5000) not null,
        "classification" varchar(40) not null,
        "status" varchar(32) not null default 'working',
        "sort_order" integer not null default 0,
        "notes" varchar(10000),
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now()
      )
    `);
    this.addSql('create index "research_claims_dossier_order_idx" on "research_claims" ("dossier_id", "sort_order")');

    this.addSql(`
      create table "research_claim_sources" (
        "id" uuid primary key default gen_random_uuid(),
        "claim_id" uuid not null references "research_claims" ("id") on delete cascade,
        "source_reference_id" uuid not null references "source_references" ("id") on delete restrict,
        "relation_type" varchar(32) not null,
        "note" varchar(2000),
        "created_at" timestamptz not null default now(),
        constraint "research_claim_sources_unique" unique ("claim_id", "source_reference_id", "relation_type")
      )
    `);

    this.addSql(`
      create table "creative_entities" (
        "id" uuid primary key default gen_random_uuid(),
        "slug" varchar(180) not null unique,
        "display_name" varchar(160) not null,
        "entity_type" varchar(40) not null,
        "summary" varchar(2000),
        "status" varchar(24) not null default 'published',
        "metadata" jsonb not null default '{}'::jsonb,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now()
      )
    `);
    this.addSql('create index "creative_entities_type_status_idx" on "creative_entities" ("entity_type", "status")');

    this.addSql(`
      create table "story_creative_entities" (
        "id" uuid primary key default gen_random_uuid(),
        "story_id" uuid not null references "stories" ("id") on delete cascade,
        "creative_entity_id" uuid not null references "creative_entities" ("id") on delete restrict,
        "created_at" timestamptz not null default now(),
        constraint "story_creative_entities_unique" unique ("story_id", "creative_entity_id")
      )
    `);

    this.addSql(`
      insert into "creative_entities" ("slug", "display_name", "entity_type", "summary")
      values
        ('moonwitness', 'MoonWitness', 'platform', null),
        ('rocksoul', 'ROCKSOUL', 'story_world', null),
        ('angelwithashotgun', 'AngelWithAShotGun', 'story_world', null),
        ('wheremythfadetolegend', 'WhereMythFadeToLegend', 'story_world', null),
        ('riot-creative', 'Riot Creative', 'creative_label', null),
        ('thebatteries', 'TheBatteries', 'collective', null),
        ('npd-team', 'NPD-Team', 'team', null),
        ('isrockfeel', 'IsRockFeel', 'culture_identity', null),
        ('walterwhite', 'WalterWhite', 'character', null),
        ('mike', 'Mike', 'character', null)
      on conflict ("slug") do nothing
    `);
  }

  async down() {
    this.addSql('drop table if exists "story_creative_entities" cascade');
    this.addSql('drop table if exists "creative_entities" cascade');
    this.addSql('drop table if exists "research_claim_sources" cascade');
    this.addSql('drop table if exists "research_claims" cascade');
    this.addSql('drop table if exists "research_dossiers" cascade');
    this.addSql('drop table if exists "story_block_sources" cascade');
    this.addSql('drop table if exists "source_references" cascade');
  }
}
