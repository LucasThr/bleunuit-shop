import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260617214821 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "homepage" ("id" text not null, "hero_badge" text null, "hero_location" text null, "hero_title" text null, "hero_subtitle" text null, "hero_image" text null, "hero_highlights" jsonb null, "hero_promo_eyebrow" text null, "hero_promo_value" text null, "hero_promo_label" text null, "hero_promo_note" text null, "value_props" jsonb null, "method_title" text null, "method_intro" text null, "method_steps" jsonb null, "cta_title" text null, "cta_text" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "homepage_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_homepage_deleted_at" ON "homepage" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "homepage" cascade;`);
  }

}
