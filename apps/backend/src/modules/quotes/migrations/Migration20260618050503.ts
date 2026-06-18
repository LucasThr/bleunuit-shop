import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260618050503 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "quote_request" ("id" text not null, "name" text not null, "email" text not null, "phone" text null, "message" text null, "product_id" text null, "product_title" text null, "status" text check ("status" in ('pending', 'handled')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "quote_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_quote_request_deleted_at" ON "quote_request" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "quote_request" cascade;`);
  }

}
