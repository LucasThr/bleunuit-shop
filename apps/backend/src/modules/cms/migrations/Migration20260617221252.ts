import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260617221252 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "blog_post" ("id" text not null, "title" text not null, "slug" text not null, "publish_date" text null, "author" text null, "excerpt" text null, "featured_image" text null, "category" text null, "content" text null, "published" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "blog_post_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_post_deleted_at" ON "blog_post" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "cms_store" ("id" text not null, "name" text not null, "slug" text not null, "address" text null, "city" text null, "postal_code" text null, "phone" text null, "email" text null, "hours" jsonb null, "map_url" text null, "latitude" integer null, "longitude" integer null, "additional_info" text null, "description" text null, "image" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "cms_store_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cms_store_deleted_at" ON "cms_store" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "testimonial" ("id" text not null, "quote" text not null, "name" text not null, "city" text null, "rank" integer null, "published" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "testimonial_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_testimonial_deleted_at" ON "testimonial" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "blog_post" cascade;`);

    this.addSql(`drop table if exists "cms_store" cascade;`);

    this.addSql(`drop table if exists "testimonial" cascade;`);
  }

}
