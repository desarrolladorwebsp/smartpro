export const RATE_LIMIT_WINDOW_MS = 60_000;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitStore = Map<string, RateLimitBucket>;

const globalStore = new Map<string, RateLimitBucket>();

export function consumeRateLimit(
  key: string,
  limit: number,
  options: { now?: number; store?: RateLimitStore; windowMs?: number } = {},
): RateLimitResult {
  const now = options.now ?? Date.now();
  const store = options.store ?? globalStore;
  const windowMs = options.windowMs ?? RATE_LIMIT_WINDOW_MS;
  const safeLimit = Math.max(1, Math.floor(limit));

  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, limit: safeLimit, remaining: safeLimit - 1, resetAt };
  }

  if (bucket.count >= safeLimit) {
    return { allowed: false, limit: safeLimit, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;

  return { allowed: true, limit: safeLimit, remaining: safeLimit - bucket.count, resetAt: bucket.resetAt };
}

export function rateLimitHeaders(result: RateLimitResult, now = Date.now()): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(Math.max(1, Math.ceil((result.resetAt - now) / 1000)));
  }

  return headers;
}

export function resetRateLimits() {
  globalStore.clear();
}
