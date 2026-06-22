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

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
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
    {
      resolve: './src/modules/cms',
    },
    {
      resolve: './src/modules/quotes',
    },
  ],
})
