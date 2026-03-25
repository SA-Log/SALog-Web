import { timingSafeEqual } from "crypto";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY ?? "";

export function verifyInternalKey(key: string | null): boolean {
  if (!INTERNAL_KEY || !key) return false;
  try {
    const a = Buffer.from(key);
    const b = Buffer.from(INTERNAL_KEY);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
