import { Migration } from "@medusajs/framework/mikro-orm/migrations";

// `latitude`/`longitude` were created as `integer` by Migration20260617221252,
// which truncated the store coordinates to "50, 3". `model.float()` maps to
// `real`, so widen the columns and re-enter the real coordinates afterwards —
// the decimals already lost are not recoverable by this migration.
export class Migration20260914113000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "cms_store" alter column "latitude" type real using ("latitude"::real);`);
    this.addSql(`alter table if exists "cms_store" alter column "longitude" type real using ("longitude"::real);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "cms_store" alter column "latitude" type integer using (round("latitude")::integer);`);
    this.addSql(`alter table if exists "cms_store" alter column "longitude" type integer using (round("longitude")::integer);`);
  }

}
