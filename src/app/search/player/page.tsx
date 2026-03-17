"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FloatingActionGroup } from "@/components/common/floating-action-button";

// ============================================================
// Types
// ============================================================

interface PlayerData {
  ouid: string;
  basic: {
    user_name: string;
    user_date_create: string;
    title_name: string | null;
    clan_name: string | null;
    manner_grade: string | null;
  } | null;
  rank: {
    grade: string;
    grade_exp: number;
    grade_ranking: number;
    season_grade: string;
    season_grade_exp: number;
    season_grade_ranking: number;
  } | null;
  tier: {
    solo_rank_match_tier: string;
    solo_rank_match_score: number;
    party_rank_match_tier: string;
    party_rank_match_score: number;
  } | null;
  recentInfo: {
    recent_win_rate: number;
    recent_kill_death_rate: number;
    recent_assault_rate: number;
    recent_sniper_rate: number;
    recent_special_rate: number;
  } | null;
  matches: MatchItem[];
}

interface MatchItem {
  match_id: string;
  match_type: string;
  match_mode: string;
  date_match: string;
  match_result: string;
  kill: number;
  death: number;
  assist: number;
}

interface MatchDetail {
  match_id: string;
  match_type: string;
  match_mode: string;
  date_match: string;
  match_map: string;
  match_detail: {
    team_id: string;
    match_result: string;
    user_name: string;
    season_grade: string;
    guild_name: string | null;
    kill: number;
    death: number;
    headshot: number;
    damage: number;
    assist: number;
  }[];
}

interface MetaData {
  grade: { grade: string; grade_image: string }[];
  seasonGrade: { season_grade: string; season_grade_image: string }[];
  tier: { tier: string; tier_image: string }[];
}

// ============================================================
// Helpers
// ============================================================

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatExp(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.floor(n / 10000).toLocaleString()}만`;
  return n.toLocaleString();
}

function getKDA(k: number, d: number, a: number) {
  return d === 0 ? (k + a).toFixed(1) : ((k + a) / d).toFixed(2);
}

const MANNER_CONFIG: Record<string, { color: string; bg: string }> = {
  "매우 좋음": { color: "text-toss-green", bg: "bg-toss-green/10 dark:bg-toss-green/20" },
  "좋음":     { color: "text-emerald-500", bg: "bg-emerald-500/10" },
  "보통":     { color: "text-toss-gray-600 dark:text-toss-gray-300", bg: "bg-secondary" },
  "나쁨":     { color: "text-toss-orange", bg: "bg-toss-orange/10" },
  "매우 나쁨": { color: "text-toss-red", bg: "bg-toss-red/10" },
};

const MODE_COLORS: Record<string, string> = {
  "폭파미션": "bg-toss-red/10 text-toss-red",
  "데스매치": "bg-toss-blue/10 text-toss-blue",
  "개인전":   "bg-toss-green/10 text-toss-green",
  "진짜를 모아라": "bg-purple-500/10 text-purple-500",
};

const TYPE_LABELS: Record<string, string> = {
  "랭크전 솔로": "솔로랭크",
  "랭크전 파티": "파티랭크",
  "일반전": "일반",
  "클랜전": "클랜",
  "퀵매치 클랜전": "퀵클랜",
  "클랜 랭크전": "클랜랭크",
  "토너먼트": "토너먼트",
};

// ============================================================
// Component
// ============================================================

export default function PlayerPage() {
  return (
    <Suspense>
      <PlayerContent />
    </Suspense>
  );
}

type SalogCommunity = { blacklistCount: number; hackReportCount: number; hackReports: { id: string; nickname: string; status: string; createdAt: string }[]; mannerReports: { id: string; nickname: string; tagType: string; tagTypes: string[]; createdAt: string }[] };

function PlayerContent() {
  const searchParams = useSearchParams();
  const ouid = searchParams.get("ouid");
  const name = searchParams.get("name");
  const nexonSn = searchParams.get("nexonSn");

  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [salog, setSalog] = useState<SalogCommunity | null>(null);
  const [barracksProfile, setBarracksProfile] = useState<{ userImg: string | null; userIntro: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [matchDetails, setMatchDetails] = useState<Record<string, MatchDetail>>({});
  const [loadingMatch, setLoadingMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "matches">("overview");
  const [matchPage, setMatchPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const MATCHES_PER_PAGE = 20;

  useEffect(() => {
    if (!ouid) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    async function attempt(): Promise<boolean> {
      try {
        const [pRes, mRes] = await Promise.all([
          fetch(`/api/sa/player?ouid=${ouid}`),
          fetch("/api/sa/metadata"),
        ]);
        if (!pRes.ok) return false;
        const [p, m] = await Promise.all([pRes.json(), mRes.json()]);
        if (cancelled) return true;
        if (!p?.basic) return false;
        setPlayer(p);
        setMeta(m);
        return true;
      } catch {
        return false;
      }
    }

    async function load() {
      const MAX_RETRIES = 3;
      for (let i = 0; i < MAX_RETRIES; i++) {
        if (cancelled) return;
        if (i > 0) await new Promise((r) => setTimeout(r, 1000 * i));
        const ok = await attempt();
        if (ok || cancelled) return;
      }
      if (!cancelled) setError(true);
    }

    load().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ouid]);

  // 크롤링 프로필 (이미지, 자기소개)
  useEffect(() => {
    if (!nexonSn) return;
    fetch(`/api/barracks/profile?nexonSn=${nexonSn}`)
      .then(r => r.json())
      .then(d => { if (d.found) setBarracksProfile({ userImg: d.userImg, userIntro: d.userIntro }); })
      .catch(() => {});
  }, [nexonSn]);

  // SALog 연동 데이터
  useEffect(() => {
    if (!nexonSn && !name) return;

    async function loadSalog() {
      let hackReports: SalogCommunity["hackReports"] = [];
      let mannerReports: SalogCommunity["mannerReports"] = [];
      let blacklistCount = 0;

      // 병영주소로 검색 (barracksAddress 매칭)
      if (nexonSn) {
        try {
          const res = await fetch(`/api/search?q=${nexonSn}&type=barracks`);
          const data = await res.json();
          hackReports = data.hackReports ?? [];
          mannerReports = data.mannerReports ?? [];
        } catch {}

        // 블랙리스트 카운트
        try {
          const res = await fetch(`/api/sa/stats?nexonSn=${nexonSn}`);
          const data = await res.json();
          blacklistCount = data.community?.blacklistCount ?? 0;
        } catch {}
      }

      // 닉네임으로도 추가 검색 (병영주소 없이 등록된 게시글 포함)
      if (name) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(name)}`);
          const data = await res.json();
          const existingIds = new Set([...hackReports.map(r => r.id), ...mannerReports.map(r => r.id)]);
          for (const r of (data.hackReports ?? [])) {
            if (!existingIds.has(r.id)) hackReports.push(r);
          }
          for (const r of (data.mannerReports ?? [])) {
            if (!existingIds.has(r.id)) mannerReports.push(r);
          }
        } catch {}
      }

      setSalog({
        blacklistCount,
        hackReportCount: hackReports.length,
        hackReports,
        mannerReports,
      });
    }
    loadSalog();
  }, [nexonSn, name]);

  const loadMatchDetail = useCallback(async (matchId: string, matchMode: string) => {
    if (matchDetails[matchId]) {
      setExpandedMatch(expandedMatch === matchId ? null : matchId);
      return;
    }
    setLoadingMatch(matchId);
    setExpandedMatch(matchId);
    try {
      const res = await fetch(`/api/sa/match?match_id=${matchId}&match_mode=${encodeURIComponent(matchMode)}`);
      const data = await res.json();
      setMatchDetails((prev) => ({ ...prev, [matchId]: data }));
    } finally {
      setLoadingMatch(null);
    }
  }, [matchDetails, expandedMatch]);

  // Metadata image lookups
  function getGradeImage(gradeName: string) {
    return meta?.grade.find((g) => g.grade === gradeName)?.grade_image;
  }
  function getSeasonGradeImage(sgName: string) {
    return meta?.seasonGrade.find((s) => s.season_grade === sgName)?.season_grade_image;
  }
  function getTierImage(tierName: string) {
    return meta?.tier.find((t) => t.tier === tierName)?.tier_image;
  }

  // Compute match stats
  const matchStats = player?.matches
    ? (() => {
        const total = player.matches.length;
        const wins = player.matches.filter((m) => m.match_result === "1").length;
        const totalK = player.matches.reduce((s, m) => s + m.kill, 0);
        const totalD = player.matches.reduce((s, m) => s + m.death, 0);
        const totalA = player.matches.reduce((s, m) => s + m.assist, 0);
        return { total, wins, losses: total - wins, winRate: total > 0 ? Math.round((wins / total) * 100) : 0, totalK, totalD, totalA };
      })()
    : null;

  // SALog 전투력 + 플레이 스타일
  const combatPower = (() => {
    if (!matchStats || !player?.recentInfo || matchStats.total === 0) return null;
    const ri = player.recentInfo;
    const ms = matchStats;
    const killScore = Math.min((ms.totalK / ms.total) * 15, 30);
    const surviveScore = Math.min((1 - Math.min(ms.totalD / ms.total / 5, 1)) * 15, 15);
    const precisionScore = Math.min((ri.recent_sniper_rate / 100) * 15, 15);
    const contribScore = Math.min((ms.totalA / ms.total) * 10, 15);
    const damageScore = Math.min((ri.recent_kill_death_rate / 200) * 15, 15);
    const winScore = Math.min((ms.winRate / 100) * 10, 10);
    const total = Math.round(Math.min(killScore + surviveScore + precisionScore + contribScore + damageScore + winScore, 100));
    return {
      total,
      breakdown: [
        { label: "킬 수", value: Math.round(killScore), max: 30, desc: `매치당 평균 ${(ms.totalK / ms.total).toFixed(1)}킬` },
        { label: "생존율", value: Math.round(surviveScore), max: 15, desc: `매치당 평균 ${(ms.totalD / ms.total).toFixed(1)}데스` },
        { label: "저격 숙련", value: Math.round(precisionScore), max: 15, desc: `저격 비율 ${ri.recent_sniper_rate.toFixed(1)}%` },
        { label: "어시스트", value: Math.round(contribScore), max: 15, desc: `매치당 평균 ${(ms.totalA / ms.total).toFixed(1)}어시` },
        { label: "K/D 비율", value: Math.round(damageScore), max: 15, desc: `K/D ${ri.recent_kill_death_rate.toFixed(2)}` },
        { label: "승률", value: Math.round(winScore), max: 10, desc: `최근 승률 ${ms.winRate}%` },
      ],
    };
  })();

  // 플레이 스타일
  const playStyle = (() => {
    if (!matchStats || matchStats.total === 0) return null;
    const ms = matchStats;
    const kpr = ms.totalK / ms.total;
    const dpr = ms.totalD / ms.total;
    const apr = ms.totalA / ms.total;
    const scores = [
      { style: "killer", label: "학살자", icon: "🎯", score: kpr },
      { style: "death", label: "데스왕", icon: "💀", score: dpr },
      { style: "assist", label: "도움왕", icon: "🤝", score: apr },
    ];
    const values = scores.map(s => s.score);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + (b - avg) ** 2, 0) / values.length);
    if (stdDev < avg * 0.3 && avg > 0) return { style: "balanced", label: "만능형", icon: "⭐" };
    return scores.sort((a, b) => b.score - a.score)[0];
  })();

  const barracksUrl = nexonSn
    ? `https://barracks.sa.nexon.com/${nexonSn}/match`
    : null;

  if (!ouid) {
    return (
      <div className="mx-auto max-w-screen-lg px-5 py-16 text-center">
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400">잘못된 접근입니다</p>
        <Link href="/search" className="text-[13px] text-primary mt-4 inline-block">검색으로 돌아가기</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-lg px-5 py-16 text-center">
        <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400">서든어택 서버에서 불러오는 중...</p>
        <p className="text-[12px] text-toss-gray-500 dark:text-toss-gray-400 mt-1">{name ?? ouid}</p>
      </div>
    );
  }

  if (error || !player?.basic) {
    return (
      <div className="mx-auto max-w-screen-lg px-5 py-16 text-center">
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400">유저 정보를 불러올 수 없습니다</p>
        <p className="text-[12px] text-toss-gray-500 dark:text-toss-gray-400 mt-1">잠시 후 다시 시도해주세요</p>
        <Link href="/search" className="text-[13px] text-primary mt-4 inline-block">검색으로 돌아가기</Link>
      </div>
    );
  }

  const b = player.basic;
  const r = player.rank;
  const t = player.tier;
  const ri = player.recentInfo;
  const manner = b.manner_grade ? MANNER_CONFIG[b.manner_grade] ?? MANNER_CONFIG["보통"] : null;

  return (
    <div className="mx-auto max-w-screen-lg px-5 py-6">
      {/* Back */}
      <Link href="/search" className="inline-flex items-center gap-1 text-[13px] text-toss-gray-600 dark:text-toss-gray-400 hover:text-foreground transition-toss mb-5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        검색으로
      </Link>

      {/* ========== PROFILE HEADER ========== */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss overflow-hidden mb-4">
        {/* Banner - Issue #4: removed grade image overlay */}
        <div className="h-24 sm:h-28 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />

        <div className="relative px-5 pb-5">
          {/* Avatar */}
          <div className="absolute -top-10 left-5">
            <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card shadow-toss-md flex items-center justify-center overflow-hidden">
              {barracksProfile?.userImg ? (
                <img src={barracksProfile.userImg} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[32px] font-bold text-primary">{b.user_name.charAt(0)}</span>
              )}
            </div>
          </div>

          <div className="pt-12 sm:pt-2 sm:pl-24">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[22px] font-bold text-foreground">{b.user_name}</h1>
                {b.clan_name && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[12px] font-semibold">{b.clan_name}</span>
                )}
              </div>
              {b.title_name && <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400 mt-0.5">{b.title_name}</p>}
              {barracksProfile?.userIntro && (
                <p className="text-[12px] text-toss-gray-500 mt-1 leading-relaxed">{barracksProfile.userIntro}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <p className="text-[12px] text-toss-gray-500 dark:text-toss-gray-400">가입일 {formatDate(b.user_date_create)}</p>
                {manner && (
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${manner.bg} ${manner.color}`}>
                    매너 {b.manner_grade}
                  </span>
                )}
              </div>
              {/* 병영수첩 바로가기 */}
              {barracksUrl && (
                <a href={barracksUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-primary/5 dark:bg-primary/10 text-[12px] font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  병영수첩 바로가기
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== RANK / TIER CARDS ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* 통합 계급 */}
        {r && (
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-4 text-center">
            {getGradeImage(r.grade) && (
              <img src={getGradeImage(r.grade)} alt={r.grade} className="w-10 h-10 mx-auto mb-2" />
            )}
            <p className="text-[10px] text-toss-gray-500 dark:text-toss-gray-400 uppercase tracking-wider mb-1">통합 계급</p>
            <p className="text-[15px] font-bold text-foreground">{r.grade}</p>
            <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 mt-1">{formatExp(r.grade_exp)} EXP</p>
            <p className="text-[10px] text-toss-gray-500 dark:text-toss-gray-400 mt-0.5">{r.grade_ranking.toLocaleString()}위</p>
          </div>
        )}

        {/* 시즌 계급 */}
        {r && (
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-4 text-center">
            {getSeasonGradeImage(r.season_grade) && (
              <img src={getSeasonGradeImage(r.season_grade)} alt={r.season_grade} className="w-10 h-10 mx-auto mb-2" />
            )}
            <p className="text-[10px] text-toss-gray-500 dark:text-toss-gray-400 uppercase tracking-wider mb-1">시즌 계급</p>
            <p className="text-[15px] font-bold text-foreground">{r.season_grade}</p>
            <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 mt-1">{formatExp(r.season_grade_exp)} EXP</p>
            <p className="text-[10px] text-toss-gray-500 dark:text-toss-gray-400 mt-0.5">{r.season_grade_ranking.toLocaleString()}위</p>
          </div>
        )}

        {/* 솔로 티어 */}
        {t && (
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-4 text-center">
            {getTierImage(t.solo_rank_match_tier) && (
              <img src={getTierImage(t.solo_rank_match_tier)} alt={t.solo_rank_match_tier} className="w-10 h-10 mx-auto mb-2" />
            )}
            <p className="text-[10px] text-toss-gray-500 dark:text-toss-gray-400 uppercase tracking-wider mb-1">솔로 랭크</p>
            <p className="text-[15px] font-bold text-foreground">{t.solo_rank_match_tier}</p>
            <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 mt-1">{t.solo_rank_match_score.toLocaleString()} RP</p>
          </div>
        )}

        {/* 파티 티어 */}
        {t && (
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-4 text-center">
            {getTierImage(t.party_rank_match_tier) && (
              <img src={getTierImage(t.party_rank_match_tier)} alt={t.party_rank_match_tier} className="w-10 h-10 mx-auto mb-2" />
            )}
            <p className="text-[10px] text-toss-gray-500 dark:text-toss-gray-400 uppercase tracking-wider mb-1">파티 랭크</p>
            <p className="text-[15px] font-bold text-foreground">{t.party_rank_match_tier}</p>
            <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 mt-1">{t.party_rank_match_score.toLocaleString()} RP</p>
          </div>
        )}
      </div>

      {/* ========== RECENT TRENDS ========== */}
      {ri && (
        <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5 mb-4">
          <h2 className="text-[14px] font-semibold text-foreground mb-4">최근 동향</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <TrendStat label="승률" value={`${ri.recent_win_rate.toFixed(1)}%`} color={ri.recent_win_rate >= 50 ? "text-toss-green" : "text-toss-red"} />
            <TrendStat label="K/D 비율" value={ri.recent_kill_death_rate.toFixed(2)} color={ri.recent_kill_death_rate >= 1 ? "text-toss-green" : "text-toss-red"} />
            <TrendStat label="돌격" value={`${ri.recent_assault_rate.toFixed(1)}%`} color="text-toss-blue" />
            <TrendStat label="저격" value={`${ri.recent_sniper_rate.toFixed(1)}%`} color="text-toss-orange" />
            <TrendStat label="특수" value={`${ri.recent_special_rate.toFixed(1)}%`} color="text-purple-500" />
          </div>
        </div>
      )}

      {/* ========== SALog 전투력 + 플레이 스타일 ========== */}
      {combatPower && playStyle && (
        <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] font-bold text-foreground">SALog 전투력</h2>
              <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-[12px] font-bold text-primary">
                {playStyle.icon} {playStyle.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[28px] font-bold text-primary tabular-nums">{combatPower.total}</span>
              <div className="text-right">
                <span className={`text-[12px] font-bold ${combatPower.total >= 70 ? "text-toss-green" : combatPower.total >= 50 ? "text-primary" : combatPower.total >= 30 ? "text-amber-500" : "text-toss-gray-400"}`}>
                  {combatPower.total >= 70 ? "상위" : combatPower.total >= 50 ? "평균 이상" : combatPower.total >= 30 ? "평균" : "평균 이하"}
                </span>
                <p className="text-[10px] text-toss-gray-400">/100점</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {combatPower.breakdown.map((b: { label: string; value: number; max: number; desc: string }) => {
              const pct = b.max > 0 ? (b.value / b.max) * 100 : 0;
              return (
                <div key={b.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-foreground">{b.label}</span>
                    <span className="text-[11px] text-toss-gray-400">{b.desc}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${pct >= 70 ? "bg-toss-green" : pct >= 40 ? "bg-primary" : "bg-toss-gray-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[12px] font-bold text-foreground w-6 tabular-nums text-right">{b.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== SALog 연동 ========== */}
      {salog && (() => {
        const confirmed = salog.hackReports.filter((r: SalogCommunity["hackReports"][0]) => r.status === "CONFIRMED");
        const hasAny = salog.blacklistCount > 0 || salog.hackReportCount > 0 || salog.mannerReports.length > 0;

        return (
          <div className="space-y-4 mb-4">
            <h2 className="text-[15px] font-bold text-foreground">SALog 연동</h2>

            {/* 상태 배너 */}
            {confirmed.length > 0 ? (
              <div className="bg-toss-red/5 border border-toss-red/20 rounded-2xl p-4">
                <p className="text-[14px] font-bold text-toss-red">🚨 핵 사용이 확정된 유저입니다</p>
                <p className="text-[12px] text-toss-gray-500 mt-1">관리자 검토를 거쳐 핵 사용이 확정되었습니다. {confirmed.length}건의 확정 판정</p>
              </div>
            ) : salog.hackReportCount > 0 ? (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                <p className="text-[14px] font-bold text-amber-600 dark:text-amber-400">⚠️ 핵 사용이 의심되는 유저입니다</p>
                <p className="text-[12px] text-toss-gray-500 mt-1">{salog.hackReportCount}건의 신고가 접수되어 커뮤니티 검토 중입니다.</p>
              </div>
            ) : !hasAny ? (
              <div className="bg-toss-green/5 border border-toss-green/20 rounded-2xl p-4">
                <p className="text-[14px] font-bold text-toss-green">✅ SALog에 등록된 신고 내역이 없습니다</p>
              </div>
            ) : null}

            {/* 커뮤니티 요약 */}
            {hasAny && (
              <div className="bg-card rounded-2xl border border-border/40 shadow-toss p-4">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-toss-red/5">
                    <span className="text-[18px] font-bold text-toss-red tabular-nums">{salog.blacklistCount}</span>
                    <span className="text-[12px] text-toss-gray-500">명이 의심</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/5">
                    <span className="text-[18px] font-bold text-amber-500 tabular-nums">{salog.hackReportCount}</span>
                    <span className="text-[12px] text-toss-gray-500">건 핵 신고</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-toss-orange/5">
                    <span className="text-[18px] font-bold text-toss-orange tabular-nums">{salog.mannerReports.length}</span>
                    <span className="text-[12px] text-toss-gray-500">건 비매너 신고</span>
                  </div>
                </div>
              </div>
            )}

            {/* 핵 탭 */}
            {/* 핵 신고 탭: 확정/유력/의심 */}
            {salog.hackReports.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/40 shadow-toss overflow-hidden">
                <div className="px-4 pt-3 pb-0"><p className="text-[12px] font-semibold text-toss-gray-500 uppercase tracking-wider">핵 신고</p></div>
                <SalogReportTabs reports={salog.hackReports} type="hack" />
              </div>
            )}

            {/* 비매너 신고 탭: 검토 중/확정 */}
            {salog.mannerReports.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/40 shadow-toss overflow-hidden">
                <div className="px-4 pt-3 pb-0">
                  <p className="text-[12px] font-semibold text-toss-gray-500 uppercase tracking-wider">비매너 신고</p>
                  <p className="text-[11px] text-toss-gray-400 mt-0.5">{salog.mannerReports.length}건의 신고가 접수되어 커뮤니티 검토 중입니다.</p>
                </div>
                <SalogReportTabs reports={salog.mannerReports} type="manner" />
              </div>
            )}
          </div>
        );
      })()}

      {/* ========== TABS ========== */}
      <div className="flex gap-1 mb-4 bg-secondary rounded-xl p-1">
        <button onClick={() => setActiveTab("overview")}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium btn-chip ${activeTab === "overview" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-600 dark:text-toss-gray-400"}`}>
          전적 요약
        </button>
        <button onClick={() => setActiveTab("matches")}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium btn-chip ${activeTab === "matches" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-600 dark:text-toss-gray-400"}`}>
          매치 기록 {matchStats && <span className="text-toss-gray-500 ml-1">{matchStats.total}</span>}
        </button>
      </div>

      {/* ========== OVERVIEW TAB ========== */}
      {activeTab === "overview" && matchStats && (
        <div className="space-y-4">
          {/* Match summary */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
            <h2 className="text-[14px] font-semibold text-foreground mb-4">최근 전적 요약</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-[24px] font-bold text-foreground">{matchStats.total}</p>
                <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400">총 경기</p>
              </div>
              <div className="text-center">
                <p className="text-[24px] font-bold text-toss-green">{matchStats.wins}</p>
                <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400">승리</p>
              </div>
              <div className="text-center">
                <p className="text-[24px] font-bold text-toss-red">{matchStats.losses}</p>
                <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400">패배</p>
              </div>
            </div>

            {/* Win rate bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[12px] mb-1.5">
                <span className="text-toss-green font-semibold">승률 {matchStats.winRate}%</span>
                <span className="text-toss-gray-600 dark:text-toss-gray-400">{matchStats.wins}승 {matchStats.losses}패</span>
              </div>
              <div className="h-2.5 rounded-full bg-toss-red/20 overflow-hidden">
                <div className="h-full rounded-full bg-toss-green transition-all duration-500" style={{ width: `${matchStats.winRate}%` }} />
              </div>
            </div>

            {/* K/D/A */}
            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-[18px] font-bold text-toss-red">{matchStats.totalK}</p>
                <p className="text-[10px] font-medium text-toss-gray-600 dark:text-toss-gray-400">KILL</p>
              </div>
              <div className="text-center">
                <p className="text-[18px] font-bold text-toss-blue">{matchStats.totalD}</p>
                <p className="text-[10px] font-medium text-toss-gray-600 dark:text-toss-gray-400">DEATH</p>
              </div>
              <div className="text-center">
                <p className="text-[18px] font-bold text-toss-green">{matchStats.totalA}</p>
                <p className="text-[10px] font-medium text-toss-gray-600 dark:text-toss-gray-400">ASSIST</p>
              </div>
              <div className="text-center">
                <p className="text-[18px] font-bold text-foreground">{getKDA(matchStats.totalK, matchStats.totalD, matchStats.totalA)}</p>
                <p className="text-[10px] font-medium text-toss-gray-600 dark:text-toss-gray-400">KDA</p>
              </div>
            </div>
          </div>

          {/* Recent 5 matches */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-foreground">최근 경기</h2>
              <button onClick={() => setActiveTab("matches")} className="text-[12px] text-primary hover:underline btn-ghost">전체보기</button>
            </div>
            <div className="space-y-2">
              {player.matches.slice(0, 5).map((m) => (
                <MatchRow key={m.match_id} match={m} playerName={b.user_name} onExpand={loadMatchDetail} expanded={expandedMatch === m.match_id} detail={matchDetails[m.match_id]} loading={loadingMatch === m.match_id} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== MATCHES TAB ========== */}
      {activeTab === "matches" && (() => {
        const visibleMatches = player.matches.slice(0, matchPage * MATCHES_PER_PAGE);
        const hasMore = visibleMatches.length < player.matches.length;
        return (
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-foreground">매치 기록</h2>
              <span className="text-[12px] text-toss-gray-500 dark:text-toss-gray-400">{player.matches.length}경기</span>
            </div>
            <div className="divide-y divide-border/30">
              {visibleMatches.map((m) => (
                <MatchRow key={m.match_id} match={m} playerName={b.user_name} onExpand={loadMatchDetail} expanded={expandedMatch === m.match_id} detail={matchDetails[m.match_id]} loading={loadingMatch === m.match_id} />
              ))}
            </div>
            {player.matches.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400">매치 기록이 없습니다</p>
              </div>
            )}
            {hasMore && (
              <div className="px-5 py-4 border-t border-border/50">
                <button
                  onClick={() => setMatchPage((p) => p + 1)}
                  className="w-full py-2.5 rounded-xl bg-secondary hover:bg-toss-gray-100 dark:hover:bg-toss-gray-700 text-[13px] font-medium text-foreground transition-toss"
                >
                  더 보기 ({visibleMatches.length}/{player.matches.length})
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">

      {/* 닉네임 복사 완료 팝업 */}
      {copied && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-card rounded-2xl p-6 shadow-toss-lg border border-border/50 text-center animate-in zoom-in-95 duration-200 mx-4">
            <div className="w-12 h-12 rounded-full bg-toss-green/10 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12L10 17L19 7" stroke="#30b87e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-[16px] font-bold text-foreground">{b.user_name}</p>
            <p className="text-[14px] text-toss-green font-semibold mt-1">복사 완료!</p>
            <p className="text-[12px] text-toss-gray-500 mt-2">병영수첩 페이지로 이동합니다...</p>
          </div>
        </div>
      )}
        <p className="text-[11px] text-toss-gray-500 dark:text-toss-gray-400">
          NEXON Open API 제공
        </p>
      </div>

      <FloatingActionGroup items={[
        { href: "/reports/new", label: "핵 신고", color: "red" },
        { href: "/manner/new", label: "비매너 신고", color: "orange" },
      ]} />

    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function TrendStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-[20px] font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function MatchRow({ match, playerName, onExpand, expanded, detail, loading }: {
  match: MatchItem;
  playerName: string;
  onExpand: (id: string, mode: string) => void;
  expanded: boolean;
  detail?: MatchDetail;
  loading: boolean;
}) {
  const isWin = match.match_result === "1";

  return (
    <div>
      <button
        onClick={() => onExpand(match.match_id, match.match_mode)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-toss text-left"
      >
        {/* Win/Lose indicator */}
        <div className={`w-1 h-10 rounded-full shrink-0 ${isWin ? "bg-toss-green" : "bg-toss-red"}`} />

        {/* Result */}
        <div className={`w-8 text-center shrink-0 text-[13px] font-bold ${isWin ? "text-toss-green" : "text-toss-red"}`}>
          {isWin ? "승" : "패"}
        </div>

        {/* Mode + Type */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${MODE_COLORS[match.match_mode] ?? "bg-secondary text-toss-gray-600"}`}>
              {match.match_mode}
            </span>
            <span className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400">
              {TYPE_LABELS[match.match_type] ?? match.match_type}
            </span>
          </div>
          <p className="text-[11px] text-toss-gray-500 dark:text-toss-gray-400 mt-0.5">{formatDateTime(match.date_match)}</p>
        </div>

        {/* K/D/A */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[14px] font-bold text-foreground">{match.kill}</span>
          <span className="text-[10px] text-toss-gray-500">/</span>
          <span className="text-[14px] font-bold text-toss-gray-600 dark:text-toss-gray-300">{match.death}</span>
          <span className="text-[10px] text-toss-gray-500">/</span>
          <span className="text-[14px] font-bold text-toss-gray-500 dark:text-toss-gray-400">{match.assist}</span>
        </div>

        {/* KDA ratio */}
        <div className="w-12 text-right shrink-0">
          <p className="text-[13px] font-bold text-foreground">{getKDA(match.kill, match.death, match.assist)}</p>
          <p className="text-[9px] text-toss-gray-500 dark:text-toss-gray-400 font-medium">KDA</p>
        </div>

        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`shrink-0 text-toss-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
          <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Expanded match detail - Issue #5: Redesigned */}
      {expanded && (
        <div className="px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-[12px] text-toss-gray-500 dark:text-toss-gray-400 ml-2">매치 상세 로딩 중...</span>
            </div>
          ) : detail ? (
            <div className="rounded-xl border border-border/50 overflow-hidden">
              {/* Map header */}
              <div className="px-4 py-3 bg-secondary/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${MODE_COLORS[detail.match_mode] ?? "bg-secondary text-toss-gray-600"}`}>
                    {detail.match_mode}
                  </span>
                  <span className="text-[13px] font-semibold text-foreground">{detail.match_map}</span>
                </div>
                <span className="text-[11px] text-toss-gray-500 dark:text-toss-gray-400">{formatDateTime(detail.date_match)}</span>
              </div>

              {/* Column headers */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-secondary/40 text-[9px] font-semibold text-toss-gray-500 dark:text-toss-gray-400 uppercase tracking-wider">
                <div className="flex-1">플레이어</div>
                <div className="w-10 text-center">K</div>
                <div className="w-10 text-center">D</div>
                <div className="w-10 text-center">A</div>
                <div className="w-10 text-center">HS</div>
                <div className="w-14 text-center">DMG</div>
                <div className="w-12 text-center">KDA</div>
              </div>

              {/* Teams */}
              {["1", "0"].map((teamId) => {
                const teamPlayers = detail.match_detail.filter((p) => p.team_id === teamId);
                if (teamPlayers.length === 0) return null;
                const teamResult = teamPlayers[0].match_result;
                const isTeamWin = teamResult === "1";

                return (
                  <div key={teamId}>
                    {/* Team label */}
                    <div className={`px-4 py-1.5 text-[11px] font-bold tracking-wide ${isTeamWin ? "bg-toss-green/10 text-toss-green border-l-2 border-toss-green" : "bg-toss-red/10 text-toss-red border-l-2 border-toss-red"}`}>
                      {isTeamWin ? "승리" : "패배"}
                    </div>

                    {/* Player rows */}
                    {teamPlayers
                      .sort((a, b) => b.kill - a.kill)
                      .map((p, i) => {
                        const isMe = p.user_name === playerName;
                        const kda = getKDA(p.kill, p.death, p.assist);
                        return (
                          <div key={i} className={`flex items-center gap-2 px-4 py-2.5 border-b border-border/20 last:border-b-0 ${isMe ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-secondary/30"}`}>
                            {/* Player info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {isMe && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                                {isMe ? (
                                  <span className="text-[12px] font-semibold truncate text-primary">{p.user_name}</span>
                                ) : (
                                  <Link href={`/search?q=${encodeURIComponent(p.user_name)}`} className="text-[12px] font-semibold truncate text-foreground hover:text-primary transition-colors">{p.user_name}</Link>
                                )}
                                {p.guild_name && <span className="text-[10px] text-toss-gray-500 dark:text-toss-gray-400">[{p.guild_name}]</span>}
                              </div>
                              <p className="text-[10px] text-toss-gray-500 dark:text-toss-gray-400">{p.season_grade}</p>
                            </div>

                            {/* Stats - desktop */}
                            <div className="hidden sm:flex items-center gap-0">
                              <div className="w-10 text-center">
                                <p className="text-[13px] font-bold text-foreground">{p.kill}</p>
                              </div>
                              <div className="w-10 text-center">
                                <p className="text-[13px] font-bold text-toss-gray-600 dark:text-toss-gray-300">{p.death}</p>
                              </div>
                              <div className="w-10 text-center">
                                <p className="text-[13px] font-bold text-toss-gray-500 dark:text-toss-gray-400">{p.assist}</p>
                              </div>
                              <div className="w-10 text-center">
                                <p className="text-[13px] font-bold text-toss-orange">{p.headshot}</p>
                              </div>
                              <div className="w-14 text-center">
                                <p className="text-[13px] font-bold text-toss-gray-700 dark:text-toss-gray-200">{Math.round(p.damage)}</p>
                              </div>
                              <div className="w-12 text-center">
                                <p className={`text-[12px] font-bold ${Number(kda) >= 2 ? "text-toss-green" : Number(kda) >= 1 ? "text-foreground" : "text-toss-red"}`}>{kda}</p>
                              </div>
                            </div>

                            {/* Stats - mobile (compact) */}
                            <div className="flex sm:hidden items-center gap-1.5 text-[11px] shrink-0">
                              <span className="font-bold text-foreground">{p.kill}</span>
                              <span className="text-toss-gray-400">/</span>
                              <span className="font-bold text-toss-gray-600 dark:text-toss-gray-300">{p.death}</span>
                              <span className="text-toss-gray-400">/</span>
                              <span className="font-bold text-toss-gray-500">{p.assist}</span>
                              <span className="text-toss-gray-400 mx-0.5">|</span>
                              <span className="font-bold text-toss-orange">{p.headshot}HS</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}

    </div>
  );
}

function SalogReportTabs({ reports, type }: { reports: { id: string; nickname: string; status?: string; createdAt: string }[]; type: "hack" | "manner" }) {
  const isHack = type === "hack";
  const tabs = isHack
    ? [
        { key: "confirmed", label: "확정", filter: (r: { status?: string }) => r.status === "CONFIRMED", color: "text-toss-red", bar: "bg-toss-red" },
        { key: "probable", label: "유력", filter: (r: { status?: string }) => r.status === "PROBABLE", color: "text-orange-500", bar: "bg-orange-500" },
        { key: "suspect", label: "의심", filter: (r: { status?: string }) => r.status === "SUSPECT" || r.status === "DISMISSED", color: "text-amber-500", bar: "bg-amber-500" },
      ]
    : [
        { key: "confirmed", label: "확정", filter: () => false, color: "text-toss-red", bar: "bg-toss-red" }, // TODO: 비매너 확정 상태 추가 후
        { key: "pending", label: "검토 중", filter: () => true, color: "text-amber-500", bar: "bg-amber-500" },
      ];

  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const basePath = isHack ? "/reports" : "/manner";

  const filtered = reports.filter(tabs.find(t => t.key === activeTab)?.filter ?? (() => false));
  const activeTabInfo = tabs.find(t => t.key === activeTab)!;

  return (
    <>
      <div className="flex border-b border-border/30">
        {tabs.map((t) => {
          const count = reports.filter(t.filter).length;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-3 text-[13px] font-medium transition-colors relative ${activeTab === t.key ? t.color : "text-toss-gray-400"}`}>
              {t.label}
              <span className="ml-1 text-[11px] tabular-nums">{count}</span>
              {activeTab === t.key && <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-full ${t.bar}`} />}
            </button>
          );
        })}
      </div>
      <div className="p-4">
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((r: { id: string; nickname: string; status?: string; createdAt: string }) => (
              <Link key={r.id} href={`${basePath}/${r.id}`} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeTabInfo.key === "confirmed" ? "bg-toss-red/5 hover:bg-toss-red/10" : "hover:bg-secondary/40"}`}>
                {isHack && r.status && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    r.status === "CONFIRMED" ? "bg-toss-red text-white" :
                    r.status === "PROBABLE" ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400" :
                    "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                  }`}>
                    {r.status === "CONFIRMED" ? "확정" : r.status === "PROBABLE" ? "유력" : "의심"}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{r.nickname}</p>
                  <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatDate(r.createdAt)}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-toss-gray-300 shrink-0"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-toss-gray-400 text-center py-6">
            {isHack ? `핵 ${activeTabInfo.label} 내역이 없습니다` : `비매너 ${activeTabInfo.label} 내역이 없습니다`}
          </p>
        )}
      </div>
    </>
  );
}
