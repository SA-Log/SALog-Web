import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const CRAWLER_URL = process.env.CRAWLER_URL ?? "http://localhost:3001";
const CRAWLER_API_KEY = process.env.CRAWLER_API_KEY ?? "";
const crawlerHeaders = { "x-api-key": CRAWLER_API_KEY };

async function crawlerFetch(path: string) {
  try {
    const res = await fetch(`${CRAWLER_URL}${path}`, { headers: crawlerHeaders });
    const data = await res.json();
    return data?.found ? data : null;
  } catch { return null; }
}

// ─── 티어 점수 매핑 (25점 만점) ───
const TIER_SCORES: Record<string, number> = {
  "에이스": 25, "다이아몬드": 22, "플래티넘": 18,
  "골드": 14, "실버": 10, "브론즈": 6, "아이언": 3,
};

function getTierScore(tierName: string): number {
  if (!tierName) return 0;
  for (const [key, score] of Object.entries(TIER_SCORES)) {
    if (tierName.includes(key)) return score;
  }
  return 0;
}

// ─── 전투력 계산 v2 (100점 만점) ───
function calculateCombatPowerV2(params: {
  tierName: string;
  tierScore: number;
  winRate: number;       // 0~100
  kdRate: number;        // 실수 (1.5 = 1.5 K/D)
  topPercent: number;    // 0~100 (상위 %)
  avgMapLevel: number;   // 맵 숙련도 평균 레벨
  hackReportCount: number;
  blacklistCount: number;
}): { total: number; breakdown: { label: string; value: number; max: number; desc: string }[] } {
  const { tierName, winRate, kdRate, topPercent, avgMapLevel, hackReportCount, blacklistCount } = params;

  // 1. 티어 (25점)
  const tier = getTierScore(tierName);

  // 2. 승률 (20점) — 50% 기준, 70%면 만점
  const win = Math.min(Math.max((winRate - 30) / 40, 0) * 20, 20);

  // 3. K/D (20점) — 1.0 기준, 2.5면 만점
  const kd = Math.min(Math.max((kdRate - 0.5) / 2.0, 0) * 20, 20);

  // 4. 상위 % (15점) — 1%면 만점, 50%면 0점
  const rank = topPercent > 0 && topPercent <= 100
    ? Math.min(Math.max((100 - topPercent) / 100, 0) * 15, 15)
    : 0;

  // 5. 맵 숙련도 (10점) — 평균 레벨 기반
  const mapSkill = Math.min(avgMapLevel / 10 * 10, 10);

  // 6. 커뮤니티 평판 (10점) — 감점 방식
  let reputation = 10;
  if (hackReportCount > 0) reputation -= Math.min(hackReportCount * 2, 5);
  if (blacklistCount > 0) reputation -= Math.min(blacklistCount, 5);
  reputation = Math.max(reputation, 0);

  const total = Math.round(Math.min(tier + win + kd + rank + mapSkill + reputation, 100));

  return {
    total,
    breakdown: [
      { label: "티어", value: Math.round(tier), max: 25, desc: tierName || "미배치" },
      { label: "승률", value: Math.round(win), max: 20, desc: winRate > 0 ? `${winRate.toFixed(1)}%` : "-" },
      { label: "K/D", value: Math.round(kd), max: 20, desc: kdRate > 0 ? `${kdRate.toFixed(2)}` : "-" },
      { label: "랭킹", value: Math.round(rank), max: 15, desc: topPercent > 0 ? `상위 ${topPercent.toFixed(1)}%` : "-" },
      { label: "맵 숙련", value: Math.round(mapSkill), max: 10, desc: avgMapLevel > 0 ? `평균 Lv.${avgMapLevel.toFixed(0)}` : "-" },
      { label: "평판", value: Math.round(reputation), max: 10, desc: hackReportCount === 0 && blacklistCount === 0 ? "클린" : `신고 ${hackReportCount}건` },
    ],
  };
}

// ─── 플레이 스타일 ───
function classifyPlayStyle(params: {
  winRate: number;
  kdRate: number;
  avgDamage: number;
  topPercent: number;
}): { style: string; label: string; icon: string; description: string } {
  const { winRate, kdRate, avgDamage, topPercent } = params;

  if (topPercent > 0 && topPercent <= 5) return { style: "pro", label: "프로급", icon: "👑", description: "최상위 랭커" };
  if (kdRate >= 2.0 && avgDamage >= 300) return { style: "killer", label: "학살자", icon: "🎯", description: "높은 K/D와 화력의 공격형" };
  if (winRate >= 60 && kdRate >= 1.5) return { style: "winner", label: "승리 메이커", icon: "🏆", description: "높은 승률의 캐리형" };
  if (kdRate >= 1.5) return { style: "fighter", label: "전투형", icon: "⚔️", description: "킬 능력이 뛰어난 전투형" };
  if (winRate >= 55) return { style: "teamplay", label: "팀플레이어", icon: "🤝", description: "팀 기여도가 높은 협력형" };
  if (avgDamage >= 250) return { style: "damage", label: "딜러", icon: "💥", description: "높은 화력의 데미지 딜러" };
  return { style: "balanced", label: "균형형", icon: "⭐", description: "안정적인 올라운드 플레이어" };
}

// ─── 메인 핸들러 ───
export async function GET(req: NextRequest) {
  const nexonSn = req.nextUrl.searchParams.get("nexonSn");
  if (!nexonSn) {
    return NextResponse.json({ error: "nexonSn 필요" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`sa-stats:${ip}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  try {
    // 최신 시즌 ID 계산
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const currentSeason = String(Math.ceil((now.getMonth() + 1) / 2)).padStart(2, "0");
    const latestSeasonId = `${yy}${currentSeason}`;

    // 병렬로 모든 데이터 수집
    const [
      profileData,
      soloRankData,
      partyRankData,
      mapSkillData,
      blacklistCount,
      hackReportCount,
    ] = await Promise.all([
      // 1. 프로필 기본
      crawlerFetch(`/api/barracks/profile?nexonSn=${nexonSn}`),
      // 2. 솔로 랭크 (최신 시즌)
      crawlerFetch(`/api/barracks/season-rank?nexonSn=${nexonSn}&seasonId=${latestSeasonId}&mode=RANK_S`),
      // 3. 파티 랭크 (최신 시즌)
      crawlerFetch(`/api/barracks/season-rank?nexonSn=${nexonSn}&seasonId=${latestSeasonId}&mode=RANK`),
      // 4. 맵 숙련도
      crawlerFetch(`/api/barracks/map-skill?nexonSn=${nexonSn}`),
      // 5. 블랙리스트
      prisma.blacklistEntry.count({ where: { barracksAddress: nexonSn } }),
      // 6. 핵 신고
      prisma.hackReport.count({ where: { barracksAddress: nexonSn } }),
    ]);

    // 솔로 우선, 없으면 파티 데이터 사용
    const rankData = soloRankData?.data || partyRankData?.data || null;
    const rankMode = soloRankData?.data ? "solo" : partyRankData?.data ? "party" : null;

    // 랭크 데이터에서 값 추출 (키 이름 유연 처리)
    const getVal = (obj: Record<string, unknown> | null, ...keys: string[]): string => {
      if (!obj) return "";
      for (const k of keys) {
        const v = obj[k];
        if (v !== undefined && v !== null && v !== "") return String(v);
      }
      return "";
    };

    const tierName = getVal(rankData, "tier_name", "tierName", "rank_tier", "season_grade", "tier");
    const tierScoreRaw = getVal(rankData, "tier_score", "tierScore", "rank_point", "rp", "score", "point");
    const winRateRaw = getVal(rankData, "win_rate", "winRate", "win_per");
    const kdRateRaw = getVal(rankData, "kill_death_rate", "kd_rate", "killDeathRate", "kill_death_per");
    const avgDamageRaw = getVal(rankData, "avg_damage", "damage_avg", "avgDamage", "damage_per_death");
    const rpRateRaw = getVal(rankData, "rp_rate", "rpRate", "rank_per", "rankPer", "top_rate", "top_per");

    const winRate = parseFloat(winRateRaw) || 0;
    let kdRate = parseFloat(kdRateRaw) || 0;
    if (kdRate > 10) kdRate = kdRate / 100; // 퍼센트 형식이면 변환
    const avgDamage = parseFloat(avgDamageRaw) || 0;
    const topPercent = parseFloat(rpRateRaw) || 0;
    const tierScore = parseFloat(tierScoreRaw) || 0;

    // 맵 숙련도 평균 레벨
    let avgMapLevel = 0;
    if (mapSkillData?.data) {
      const maps = Array.isArray(mapSkillData.data) ? mapSkillData.data : (mapSkillData.data.mapList || mapSkillData.data.maps || mapSkillData.data.list || []);
      if (maps.length > 0) {
        const levels = maps.slice(0, 5).map((m: Record<string, unknown>) => {
          const lv = parseFloat(String(m.level || m.map_level || m.skill_level || "0"));
          return isNaN(lv) ? 0 : lv;
        });
        avgMapLevel = levels.reduce((a: number, b: number) => a + b, 0) / levels.length;
      }
    }

    // 전투력 계산
    const combatPower = calculateCombatPowerV2({
      tierName,
      tierScore,
      winRate,
      kdRate,
      topPercent,
      avgMapLevel,
      hackReportCount,
      blacklistCount,
    });

    const playStyle = classifyPlayStyle({ winRate, kdRate, avgDamage, topPercent });

    return NextResponse.json({
      profile: profileData ? {
        nickname: profileData.nickname,
        nexonSn: profileData.nexonSn,
        level: profileData.level,
        clanName: profileData.clanName,
        userImg: profileData.userImg,
        userIntro: profileData.userIntro,
      } : null,
      combatPower,
      playStyle,
      rankMode,
      latestSeasonId,
      community: { blacklistCount, hackReportCount },
    });
  } catch (err) {
    console.error("[sa/stats] 에러:", err);
    return NextResponse.json({ error: "통계 조회에 실패했습니다" }, { status: 500 });
  }
}
