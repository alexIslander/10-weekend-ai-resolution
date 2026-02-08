import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
  ADMIN_TOKEN: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  BASE_PRICE_CENTS: z.string().optional(),
  DATA_RETENTION_DAYS: z.string().optional(),
  COUPON_ATTEMPT_LIMIT: z.string().optional(),
  COUPON_COOLDOWN_MINUTES: z.string().optional(),
  COUPON_BAN_MINUTES: z.string().optional(),
  COUPON_COOLDOWN_AFTER_ATTEMPTS: z.string().optional()
});

export const env = envSchema.parse(process.env);

export const adminEmails = (env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);
