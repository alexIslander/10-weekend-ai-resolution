type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const getStore = () => {
  const globalStore = globalThis as typeof globalThis & {
    __dualrevealRateLimit?: Map<string, RateLimitRecord>;
  };
  if (!globalStore.__dualrevealRateLimit) {
    globalStore.__dualrevealRateLimit = new Map();
  }
  return globalStore.__dualrevealRateLimit;
};

export const checkRateLimit = (
  key: string,
  limit: number,
  windowMs: number
) => {
  const store = getStore();
  const now = Date.now();
  const record = store.get(key);
  if (!record || record.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }
  record.count += 1;
  store.set(key, record);
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
};
