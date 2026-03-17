import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const CRAWLER_URL = process.env.CRAWLER_URL ?? "http://localhost:3001";
const CRAWLER_API_KEY = process.env.CRAWLER_API_KEY ?? "";

// 플레이 스타일 분류
function classifyPlayStyle(stats: {
  killPerRound: number;
  deathPerRound: number;
  assistPerRound: number;
  savePerRound: number;
  missionPerRound: number;
  headshotRate: number;
}): { style: string; label: string; description: string } {
  const { killPerRound, deathPerRound, assistPerRound, savePerRound, missionPerRound } = stats;

  const scores = [
    { style: "killer", label: "학살자", description: "킬 수가 압도적으로 높은 공격형 플레이어", score: killPerRound },
    { style: "death", label: "데스왕", description: "적극적으로 교전에 임하는 돌격형 플레이어", score: deathPerRound },
    { style: "assist", label: "도움왕", description: "팀원의 킬을 돕는 기여형 플레이어", score: assistPerRound },
    { style: "save", label: "수호자", description: "팀원을 구하는 수비형 플레이어", score: savePerRound },
    { style: "mission", label: "폭발물 처리반", description: "미션 수행에 집중하는 전략형 플레이어", score: missionPerRound },
  ];

  // 표준편차 기반 — 모든 스탯이 비슷하면 만능형
  const values = scores.map(s => s.score);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((a, b) => a + (b - avg) ** 2, 0) / values.length);

  if (stdDev < avg * 0.3 && avg > 0) {
    return { style: "balanced", label: "만능형", description: "모든 면에서 균형 잡힌 올라운드 플레이어" };
  }

  const top = scores.sort((a, b) => b.score - a.score)[0];
  return top;
}

// 환산 스탯 계산 (0~100)
function calculateCombatPower(stats: {
  killPerRound: number;
  deathPerRound: number;
  headshotRate: number;
  assistPerRound: number;
  savePerRound: number;
  damagePerDeath: number;
  winRate: number;
}): {
  total: number;
  breakdown: { label: string; value: number; max: number }[];
} {
  const kill = Math.min(stats.killPerRound * 30, 30);
  const survive = Math.min((1 - Math.min(stats.deathPerRound, 1)) * 15, 15);
  const precision = Math.min(stats.headshotRate * 15, 15);
  const contribution = Math.min((stats.assistPerRound + stats.savePerRound) * 15, 15);
  const damage = Math.min((stats.damagePerDeath / 500) * 15, 15);
  const win = Math.min(stats.winRate * 10, 10);

  const total = Math.round(kill + survive + precision + contribution + damage + win);

  return {
    total: Math.min(total, 100),
    breakdown: [
      { label: "킬", value: Math.round(kill), max: 30 },
      { label: "생존", value: Math.round(survive), max: 15 },
      { label: "정밀", value: Math.round(precision), max: 15 },
      { label: "기여", value: Math.round(contribution), max: 15 },
      { label: "대미지", value: Math.round(damage), max: 15 },
      { label: "승률", value: Math.round(win), max: 10 },
    ],
  };
}

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
    // 크롤링 서버에서 프로필 + 전투 정보 조회
    const profileRes = await fetch(`${CRAWLER_URL}/api/barracks/matches?nexonSn=${nexonSn}`, {
      headers: { "x-api-key": CRAWLER_API_KEY },
    });
    const profile = await profileRes.json();

    if (!profile.found) {
      return NextResponse.json({ error: "유저를 찾을 수 없습니다" }, { status: 404 });
    }

    // 블랙리스트 공유 네트워크 — 이 유저를 몇 명이 블랙리스트에 등록했는지
    const blacklistCount = await prisma.blacklistEntry.count({
      where: { barracksAddress: nexonSn },
    });

    // SALog 핵 신고 수
    const hackReportCount = await prisma.hackReport.count({
      where: { barracksAddress: nexonSn },
    });

    // 기본 battleInfo에서 통계 추출
    const bi = profile.battleInfo;
    const winRate = bi ? parseFloat(bi.win_per) / 100 : 0;
    const kdRate = bi ? parseFloat(bi.kill_death_per) / 100 : 0;

    // TODO: 실제 매치 데이터에서 상세 통계 계산 (Phase 2.5)
    // 현재는 battleInfo 기반 추정치
    const estimatedStats = {
      killPerRound: kdRate * 0.8,
      deathPerRound: 0.8 / (kdRate || 1),
      headshotRate: 0.25, // 기본값 (매치 상세에서 추출 필요)
      assistPerRound: 0.3,
      savePerRound: 0.1,
      missionPerRound: 0.1,
      damagePerDeath: kdRate * 300,
      winRate,
    };

    const combatPower = calculateCombatPower(estimatedStats);
    const playStyle = classifyPlayStyle(estimatedStats);

    return NextResponse.json({
      profile: {
        nickname: profile.nickname,
        nexonSn: profile.nexonSn,
        level: profile.level,
        seasonLevel: profile.seasonLevel,
        clanName: profile.clanName,
        rankNo: profile.rankNo,
        rankPer: profile.rankPer,
        totalRankNo: profile.totalRankNo,
        totalSp: profile.totalSp,
        userImg: profile.userImg,
        userIntro: profile.userIntro,
        battleInfo: profile.battleInfo,
      },
      combatPower,
      playStyle,
      community: {
        blacklistCount,
        hackReportCount,
      },
    });
  } catch (err) {
    console.error("[sa/stats] 에러:", err);
    return NextResponse.json({ error: "통계 조회에 실패했습니다" }, { status: 500 });
  }
}
