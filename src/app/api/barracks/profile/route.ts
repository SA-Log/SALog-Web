import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const CRAWLER_URL = process.env.CRAWLER_URL ?? "http://localhost:3001";
const CRAWLER_API_KEY = process.env.CRAWLER_API_KEY ?? "";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다", found: false }, { status: 401 });
  }

  const rl = rateLimit(`barracks-profile:${session.user.id}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다", found: false }, { status: 429 });
  }

  const nexonSn = req.nextUrl.searchParams.get("nexonSn");
  if (!nexonSn || !/^\d+$/.test(nexonSn)) {
    return NextResponse.json({ error: "올바른 병영주소가 아닙니다", found: false }, { status: 400 });
  }

  try {
    const res = await fetch(`${CRAWLER_URL}/api/barracks/profile?nexonSn=${nexonSn}`, {
      headers: { "x-api-key": CRAWLER_API_KEY },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "병영수첩 조회에 실패했습니다", found: false });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다", found: false }, { status: 500 });
  }
}
