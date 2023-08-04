import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // OpenAI
    OPEN_AI_API_KEY: z.string().min(10),
    LANGSMITH_API_KEY: z.string().min(10),
    // Clerk
    CLERK_SECRET_KEY: z.string().min(10),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(10),
    // Upstash Redis
    REDIS_URL: z.string().url(),
    // Turso db
    TURSO_DB_URL: z.string().min(1),
    TURSO_DB_AUTH_TOKEN: z.string().min(1),
    // sentry
    SENTRY_AUTH_TOKEN: z.string().min(1),
    SENTRY_ORG: z.string().min(1),
    SENTRY_PROJECT: z.string().min(1),
  },

  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(10),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().min(1),
  },

  runtimeEnv: {
    // Clerk (Auth)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    // Upstash (Redis)
    REDIS_URL: process.env.REDIS_URL,
    // OpenAI
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
    LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
    // turso db
    TURSO_DB_URL: process.env.TURSO_DB_URL,
    TURSO_DB_AUTH_TOKEN: process.env.TURSO_DB_AUTH_TOKEN,
    // sentry
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_AUTH_TOKEN,
  },
});

