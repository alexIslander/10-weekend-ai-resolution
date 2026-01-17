const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const PUBLIC_CONFIG = {
  basePriceCents: toNumber(process.env.NEXT_PUBLIC_BASE_PRICE_CENTS, 999),
  couponAttemptLimit: toNumber(process.env.NEXT_PUBLIC_COUPON_ATTEMPT_LIMIT, 10)
};
