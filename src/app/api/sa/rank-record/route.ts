import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const CRAWLER_URL = process.env.CRAWLER_URL ?? "http://localhost:3001";
const CRAWLER_API_KEY = process.env.CRAWLER_API_KEY ?? "";

// 시즌별 랭크 기록 (솔로/파티)
// ?nexonSn=xxx&seasonId=2601&mode=RANK_S
export async function GET(req: NextRequest) {
  const nexonSn = req.nextUrl.searchParams.get("nexonSn");
  const seasonId = req.nextUrl.searchParams.get("seasonId");
  const mode = req.nextUrl.searchParams.get("mode"); // RANK_S | RANK
  if (!nexonSn || !seasonId || !mode) {
    return NextResponse.json({ error: "nexonSn, seasonId, mode 필요" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`rank-record:${ip}`, { limit: 20, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  try {
    const params = new URLSearchParams({ nexonSn, seasonId, mode });
    const res = await fetch(`${CRAWLER_URL}/api/barracks/season-rank?${params}`, {
      headers: { "x-api-key": CRAWLER_API_KEY },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[rank-record] 에러:", err);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
