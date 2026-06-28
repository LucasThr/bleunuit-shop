import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260628085950 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "contact" ("id" text not null, "store_name" text null, "address" text null, "phone" text null, "email" text null, "hours" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "contact_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_contact_deleted_at" ON "contact" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "contact" cascade;`);
  }

}
