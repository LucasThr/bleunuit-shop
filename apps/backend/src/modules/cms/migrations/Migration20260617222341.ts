import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260617222341 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "cms_brand" ("id" text not null, "name" text not null, "slug" text not null, "logo" text null, "website" text null, "description" text null, "rank" integer null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "cms_brand_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cms_brand_deleted_at" ON "cms_brand" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "cms_brand" cascade;`);
  }

}
