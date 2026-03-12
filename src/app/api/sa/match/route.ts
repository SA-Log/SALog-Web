import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NEXON_OPEN_API_KEY ?? "";
const BASE = "https://open.api.nexon.com/suddenattack/v1";

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("match_id")?.trim();
  const matchMode = req.nextUrl.searchParams.get("match_mode")?.trim();
  if (!matchId || !matchMode || !API_KEY) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${BASE}/match-detail?match_id=${encodeURIComponent(matchId)}&match_mode=${encodeURIComponent(matchMode)}`,
      { headers: { "x-nxopen-api-key": API_KEY } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "매치 정보를 불러올 수 없습니다" }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
