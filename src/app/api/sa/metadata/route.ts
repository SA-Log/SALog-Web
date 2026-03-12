import { NextResponse } from "next/server";

const API_KEY = process.env.NEXON_OPEN_API_KEY ?? "";
const STATIC = "https://open.api.nexon.com/static/suddenattack/meta";
const headers = { "x-nxopen-api-key": API_KEY };

let cache: { data: unknown; ts: number } | null = null;
const TTL = 1000 * 60 * 60 * 24; // 24h

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  const [gradeRes, seasonRes, tierRes] = await Promise.all([
    fetch(`${STATIC}/grade`, { headers }),
    fetch(`${STATIC}/season_grade`, { headers }),
    fetch(`${STATIC}/tier`, { headers }),
  ]);

  const grade = gradeRes.ok ? await gradeRes.json() : [];
  const seasonGrade = seasonRes.ok ? await seasonRes.json() : [];
  const tier = tierRes.ok ? await tierRes.json() : [];

  const data = { grade, seasonGrade, tier };
  cache = { data, ts: Date.now() };
  return NextResponse.json(data);
}
