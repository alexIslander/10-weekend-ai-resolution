import { env } from "@/lib/env";

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const APP_CONFIG = {
  basePriceCents: toNumber(env.BASE_PRICE_CENTS, 999),
  dataRetentionDays: toNumber(env.DATA_RETENTION_DAYS, 90),
  couponAttemptLimit: toNumber(env.COUPON_ATTEMPT_LIMIT, 10),
  couponCooldownMinutes: toNumber(env.COUPON_COOLDOWN_MINUTES, 30),
  couponBanMinutes: toNumber(env.COUPON_BAN_MINUTES, 1440),
  couponCooldownAfterAttempts: toNumber(
    env.COUPON_COOLDOWN_AFTER_ATTEMPTS,
    3
  )
};
