import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NEXON_OPEN_API_KEY ?? "";
const BASE = "https://open.api.nexon.com/suddenattack/v1";
const STATIC = "https://open.api.nexon.com/static/suddenattack/meta";
const headers = { "x-nxopen-api-key": API_KEY };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeFetch(url: string, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) return res.json();
    } catch { /* retry */ }
    if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  return null;
}

export async function GET(req: NextRequest) {
  const ouid = req.nextUrl.searchParams.get("ouid")?.trim();
  if (!ouid || !API_KEY) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  // Fetch all data in parallel
  const [basic, rank, tier, recentInfo, matchBomb, matchDM, matchSolo, matchFFA] = await Promise.all([
    safeFetch(`${BASE}/user/basic?ouid=${ouid}`),
    safeFetch(`${BASE}/user/rank?ouid=${ouid}`),
    safeFetch(`${BASE}/user/tier?ouid=${ouid}`),
    safeFetch(`${BASE}/user/recent-info?ouid=${ouid}`),
    safeFetch(`${BASE}/match?ouid=${ouid}&match_mode=${encodeURIComponent("폭파미션")}`),
    safeFetch(`${BASE}/match?ouid=${ouid}&match_mode=${encodeURIComponent("데스매치")}`),
    safeFetch(`${BASE}/match?ouid=${ouid}&match_mode=${encodeURIComponent("개인전")}`),
    safeFetch(`${BASE}/match?ouid=${ouid}&match_mode=${encodeURIComponent("진짜를 모아라")}`),
  ]);

  // Merge & sort matches (latest first)
  const allMatches = [
    ...(matchBomb?.match ?? []),
    ...(matchDM?.match ?? []),
    ...(matchSolo?.match ?? []),
    ...(matchFFA?.match ?? []),
  ]
    .sort((a: { date_match: string }, b: { date_match: string }) =>
      new Date(b.date_match).getTime() - new Date(a.date_match).getTime()
    );

  return NextResponse.json({
    ouid,
    basic,
    rank,
    tier,
    recentInfo,
    matches: allMatches,
  });
}
