import {
  loadEnv,
  defineConfig,
  Modules,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: process.env.WORKER_MODE as "shared" | "worker" | "server",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
      authMethodsPerActor: {
        user: ["emailpass"],
        customer: ["emailpass", "phone-auth"],
      },
    },
  },

  admin: {
    disable: process.env.DISABLE_ADMIN === "true",
    backendUrl: process.env.BACKEND_URL,
  },

  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",

      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",

      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",

      options: {
        redis: {
          url: process.env.REDIS_URL,
        },
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              additional_client_config: {
                forcePathStyle: process.env.S3_FORCE_PATH_STYLE,
              },
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/auth",
      dependencies: [
        Modules.CACHE,
        ContainerRegistrationKeys.LOGGER,
        Modules.EVENT_BUS,
      ],
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
          },
          {
            resolve: "./src/modules/phone-auth",
            id: "phone-auth",
            options: {
              accountSid: process.env.TWILIO_ACCOUNT_SID,
              authToken: process.env.TWILIO_AUTH_TOKEN,
              serviceSid: process.env.TWILIO_SERVICE_SID,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          },
        ],
      },
    },
  ],
  plugins: [
    {
      resolve: "medusa-plugin-import-shopify",
      options: {
        storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
        adminToken: process.env.SHOPIFY_ADMIN_TOKEN,
        AWS_REGION: process.env.S3_REGION,
        AWS_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
        AWS_S3_BUCKET: process.env.S3_BUCKET,
      },
    },
    {
      resolve: "medusa-variant-images",
      options: {},
    },
    {
      resolve: "medusa-backup",
      options: {},
    },
  ],
});
