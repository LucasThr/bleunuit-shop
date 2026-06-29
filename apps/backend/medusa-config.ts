import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Fail closed: never boot with a default/guessable auth secret. Generate
// strong values with `openssl rand -base64 32` and set them in the environment.
const jwtSecret = process.env.JWT_SECRET
const cookieSecret = process.env.COOKIE_SECRET
if (!jwtSecret || !cookieSecret) {
  throw new Error(
    'JWT_SECRET and COOKIE_SECRET must be set. Generate them with: openssl rand -base64 32'
  )
}

// Stripe is wired but only activates once STRIPE_API_KEY is set in .env.
// Until then the built-in manual provider (pp_system_default) drives the
// POC checkout, so the full cart -> order flow works without real keys.
const stripeProviders = process.env.STRIPE_API_KEY
  ? [
      {
        resolve: '@medusajs/medusa/payment-stripe',
        id: 'stripe',
        options: {
          apiKey: process.env.STRIPE_API_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        },
      },
    ]
  : []

// In production, cache / events / background jobs are backed by Redis so their
// state survives restarts and the app can run a separate worker or scale out.
// With no REDIS_URL (local dev) Medusa falls back to its in-memory defaults.
const redisModules = process.env.REDIS_URL
  ? [
      {
        resolve: '@medusajs/medusa/cache-redis',
        options: { redisUrl: process.env.REDIS_URL },
      },
      {
        resolve: '@medusajs/medusa/event-bus-redis',
        options: { redisUrl: process.env.REDIS_URL },
      },
      {
        resolve: '@medusajs/medusa/workflow-engine-redis',
        options: { redis: { url: process.env.REDIS_URL } },
      },
    ]
  : []

// Uploaded files (product + CMS images) go to S3-compatible object storage in
// production — the container filesystem is ephemeral and wiped on every deploy.
// Works with any S3-compatible store (e.g. Cloudflare R2) via the S3_* vars.
// With no endpoint set (local dev) Medusa uses its default on-disk provider.
const fileModule = process.env.S3_ENDPOINT
  ? [
      {
        resolve: '@medusajs/medusa/file',
        options: {
          providers: [
            {
              resolve: '@medusajs/medusa/file-s3',
              id: 's3',
              options: {
                file_url: process.env.S3_FILE_URL,
                access_key_id: process.env.S3_ACCESS_KEY_ID,
                secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                region: process.env.S3_REGION || 'auto',
                bucket: process.env.S3_BUCKET,
                endpoint: process.env.S3_ENDPOINT,
              },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Managed Postgres providers usually require TLS; enable it with
    // DATABASE_SSL=true in the deploy env (no effect on local dev).
    databaseDriverOptions:
      process.env.DATABASE_SSL === 'true'
        ? { connection: { ssl: { rejectUnauthorized: false } } }
        : undefined,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret,
      cookieSecret,
    },
  },
  modules: [
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: stripeProviders,
      },
    },
    ...redisModules,
    ...fileModule,
    {
      resolve: './src/modules/cms',
    },
    {
      resolve: './src/modules/quotes',
    },
  ],
})
