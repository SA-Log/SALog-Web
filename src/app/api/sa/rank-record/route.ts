import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const CRAWLER_URL = process.env.CRAWLER_URL ?? "http://localhost:3001";
const CRAWLER_API_KEY = process.env.CRAWLER_API_KEY ?? "";

export async function GET(req: NextRequest) {
  const nexonSn = req.nextUrl.searchParams.get("nexonSn");
  const year = req.nextUrl.searchParams.get("year");
  if (!nexonSn) {
    return NextResponse.json({ error: "nexonSn 필요" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`rank-record:${ip}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  try {
    const params = new URLSearchParams({ nexonSn });
    if (year) params.set("year", year);

    // rank-record 엔드포인트 — 시즌별 상세 데이터
    const res = await fetch(`${CRAWLER_URL}/api/barracks/rank-record?${params}`, {
      headers: { "x-api-key": CRAWLER_API_KEY },
    });
    const data = await res.json();

    if (!data.found) {
      // fallback: game-record 엔드포인트
      const grRes = await fetch(`${CRAWLER_URL}/api/barracks/game-record?nexonSn=${nexonSn}`, {
        headers: { "x-api-key": CRAWLER_API_KEY },
      });
      const grData = await grRes.json();
      return NextResponse.json(grData);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[rank-record] 에러:", err);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
