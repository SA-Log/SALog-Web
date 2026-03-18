import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const API_KEY = process.env.NEXON_OPEN_API_KEY ?? "";
const BASE = "https://open.api.nexon.com/suddenattack/v1";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`map-stats:${ip}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  const body = await req.json();
  const matches: { match_id: string; match_mode: string }[] = body.matches;
  if (!matches || !Array.isArray(matches) || matches.length === 0) {
    return NextResponse.json({ error: "matches 필요" }, { status: 400 });
  }

  // 최대 30개 처리
  const subset = matches.slice(0, 30);

  const details = await Promise.allSettled(
    subset.map(async (m) => {
      const res = await fetch(
        `${BASE}/match-detail?match_id=${encodeURIComponent(m.match_id)}&match_mode=${encodeURIComponent(m.match_mode)}`,
        { headers: { "x-nxopen-api-key": API_KEY } }
      );
      if (!res.ok) return null;
      return res.json();
    })
  );

  // 맵별 집계
  const mapStats: Record<string, { wins: number; total: number; kills: number; deaths: number }> = {};
  const playerName = body.playerName?.toLowerCase();

  for (const result of details) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const d = result.value;
    const mapName = d.match_map;
    if (!mapName) continue;

    if (!mapStats[mapName]) {
      mapStats[mapName] = { wins: 0, total: 0, kills: 0, deaths: 0 };
    }
    mapStats[mapName].total++;

    // 해당 플레이어의 데이터 찾기
    if (playerName && d.match_detail) {
      const player = d.match_detail.find(
        (p: { user_name: string }) => p.user_name.toLowerCase() === playerName
      );
      if (player) {
        if (player.match_result === "1") mapStats[mapName].wins++;
        mapStats[mapName].kills += player.kill ?? 0;
        mapStats[mapName].deaths += player.death ?? 0;
      }
    }
  }

  // TOP 맵 정렬 (플레이 횟수 → 승률)
  const sorted = Object.entries(mapStats)
    .map(([name, s]) => ({
      name,
      total: s.total,
      wins: s.wins,
      winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
      avgKills: s.total > 0 ? +(s.kills / s.total).toFixed(1) : 0,
      kd: s.deaths > 0 ? +(s.kills / s.deaths).toFixed(2) : s.kills,
    }))
    .sort((a, b) => b.total - a.total || b.winRate - a.winRate);

  return NextResponse.json({ maps: sorted, matchCount: subset.length });
}
