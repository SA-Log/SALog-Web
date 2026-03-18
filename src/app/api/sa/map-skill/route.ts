import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const CRAWLER_URL = process.env.CRAWLER_URL ?? "http://localhost:3001";
const CRAWLER_API_KEY = process.env.CRAWLER_API_KEY ?? "";

// 맵 숙련도 프록시 (Maps/GetMapSkillLevel)
export async function GET(req: NextRequest) {
  const nexonSn = req.nextUrl.searchParams.get("nexonSn");
  if (!nexonSn) {
    return NextResponse.json({ error: "nexonSn 필요" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`map-skill:${ip}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  try {
    const res = await fetch(`${CRAWLER_URL}/api/barracks/map-skill?nexonSn=${nexonSn}`, {
      headers: { "x-api-key": CRAWLER_API_KEY },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[map-skill] 에러:", err);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
