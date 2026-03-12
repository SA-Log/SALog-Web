const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  /** Max requests in the window */
  limit: number;
  /** Window in seconds */
  windowSec: number;
}

/**
 * Simple in-memory rate limiter.
 * Returns { success: true } if allowed, { success: false } if rate limited.
 */
export function rateLimit(
  key: string,
  { limit, windowSec }: RateLimitOptions
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}
