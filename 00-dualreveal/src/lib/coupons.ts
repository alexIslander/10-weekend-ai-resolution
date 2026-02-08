import { APP_CONFIG } from "@/lib/config";
import { getDataStore } from "@/lib/data";
import { hashIdentifier } from "@/lib/hash";

export type CouponValidationResult = {
  valid: boolean;
  message: string;
  discountPercent: number;
  finalPriceCents: number;
  attemptsRemaining: number;
  cooldownUntil?: string | null;
  bannedUntil?: string | null;
  campaignActive: boolean;
  campaignPercent: number;
};

const asDate = (value?: string | null) => (value ? new Date(value) : null);

export const validateCouponForEmail = async (
  email: string,
  code: string | null
): Promise<CouponValidationResult> => {
  const store = getDataStore();
  const normalizedEmail = email.trim().toLowerCase();
  const basePrice = APP_CONFIG.basePriceCents;

  const campaignFlag = await store.getFeatureFlag("campaign_discount");
  const campaignActive = campaignFlag?.enabled ?? false;
  const campaignPercent =
    typeof campaignFlag?.config?.percentOff === "number"
      ? (campaignFlag.config.percentOff as number)
      : 0;

  if (!code) {
    const discountPercent = campaignActive ? campaignPercent : 0;
    const finalPriceCents = Math.max(
      0,
      Math.round(basePrice * (1 - discountPercent / 100))
    );
    return {
      valid: true,
      message: campaignActive
        ? `Campaign active: ${campaignPercent}% off applied.`
        : "No coupon applied.",
      discountPercent,
      finalPriceCents,
      attemptsRemaining: APP_CONFIG.couponAttemptLimit,
      cooldownUntil: null,
      bannedUntil: null,
      campaignActive,
      campaignPercent
    };
  }

  const attemptKey = `email:${hashIdentifier(normalizedEmail)}`;
  const attempt = await store.getCouponAttempt(attemptKey);
  const now = new Date();

  const bannedUntil = asDate(attempt?.bannedUntil);
  if (bannedUntil && bannedUntil > now) {
    return {
      valid: false,
      message: "Too many attempts. Try again later.",
      discountPercent: 0,
      finalPriceCents: basePrice,
      attemptsRemaining: 0,
      cooldownUntil: attempt?.cooldownUntil ?? null,
      bannedUntil: attempt?.bannedUntil ?? null,
      campaignActive,
      campaignPercent
    };
  }

  const cooldownUntil = asDate(attempt?.cooldownUntil);
  if (cooldownUntil && cooldownUntil > now) {
    return {
      valid: false,
      message: "Please wait before trying another code.",
      discountPercent: 0,
      finalPriceCents: basePrice,
      attemptsRemaining: Math.max(
        0,
        APP_CONFIG.couponAttemptLimit - (attempt?.attempts ?? 0)
      ),
      cooldownUntil: attempt?.cooldownUntil ?? null,
      bannedUntil: null,
      campaignActive,
      campaignPercent
    };
  }

  const coupon = await store.getCouponByCode(code.trim());
  const expiresAt = asDate(coupon?.expiresAt);
  const isExpired = expiresAt ? expiresAt < now : false;
  const exceededRedemptions =
    coupon?.maxRedemptions != null &&
    coupon.redemptions >= coupon.maxRedemptions;

  const isValid =
    coupon && coupon.active && !isExpired && !exceededRedemptions;

  if (!isValid) {
    const attempts = (attempt?.attempts ?? 0) + 1;
    const updates = {
      attempts,
      cooldownUntil:
        attempts >= APP_CONFIG.couponCooldownAfterAttempts
          ? new Date(
              now.getTime() + APP_CONFIG.couponCooldownMinutes * 60 * 1000
            ).toISOString()
          : null,
      bannedUntil:
        attempts >= APP_CONFIG.couponAttemptLimit
          ? new Date(
              now.getTime() + APP_CONFIG.couponBanMinutes * 60 * 1000
            ).toISOString()
          : null
    };
    await store.upsertCouponAttempt(attemptKey, updates);

    return {
      valid: false,
      message: "Coupon not recognized.",
      discountPercent: 0,
      finalPriceCents: basePrice,
      attemptsRemaining: Math.max(0, APP_CONFIG.couponAttemptLimit - attempts),
      cooldownUntil: updates.cooldownUntil,
      bannedUntil: updates.bannedUntil,
      campaignActive,
      campaignPercent
    };
  }

  const discountPercent = coupon.percentOff;
  const finalPriceCents = Math.max(
    0,
    Math.round(basePrice * (1 - discountPercent / 100))
  );

  return {
    valid: true,
    message: `Coupon applied: ${discountPercent}% off.`,
    discountPercent,
    finalPriceCents,
    attemptsRemaining: Math.max(
      0,
      APP_CONFIG.couponAttemptLimit - (attempt?.attempts ?? 0)
    ),
    cooldownUntil: null,
    bannedUntil: null,
    campaignActive,
    campaignPercent
  };
};
