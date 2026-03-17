"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { LoginPrompt } from "@/components/common/login-prompt";
import { HACK_STATUS_MAP, MANNER_TAG_MAP } from "@/lib/mock-data";

type StatsData = {
  profile: {
    nickname: string;
    nexonSn: number;
    level: number;
    seasonLevel: number;
    clanName: string | null;
    rankNo: string;
    rankPer: string;
    totalRankNo: string;
    totalSp: string;
    userImg: string | null;
    userIntro: string | null;
    battleInfo: {
      win_per: string;
      kill_death_per: string;
      ar_per: string;
      sr_per: string;
    } | null;
  };
  combatPower: {
    total: number;
    breakdown: { label: string; value: number; max: number }[];
  };
  playStyle: { style: string; label: string; description: string };
  community: { blacklistCount: number; hackReportCount: number };
};

type HackReport = { id: string; nickname: string; status: string; hackTypes: string[]; createdAt: string };
type MannerReport = { id: string; nickname: string; tagType: string; tagTypes: string[]; createdAt: string };

function formatDate(d: string) { const dt = new Date(d); return `${dt.getFullYear()}.${dt.getMonth()+1}.${dt.getDate()}`; }

const STYLE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  killer: { bg: "bg-toss-red/10", text: "text-toss-red", icon: "🎯" },
  death: { bg: "bg-toss-blue/10", text: "text-toss-blue", icon: "💀" },
  assist: { bg: "bg-toss-green/10", text: "text-toss-green", icon: "🤝" },
  save: { bg: "bg-purple-500/10", text: "text-purple-500", icon: "🛡️" },
  mission: { bg: "bg-amber-500/10", text: "text-amber-500", icon: "💣" },
  balanced: { bg: "bg-primary/10", text: "text-primary", icon: "⭐" },
};

function CombatPowerBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-toss-gray-500 w-10 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-foreground w-8 tabular-nums">{value}</span>
    </div>
  );
}

export default function BarracksUserPage({ params }: { params: Promise<{ nexonSn: string }> }) {
  const { nexonSn } = use(params);
  const { isLoggedIn } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [hackReports, setHackReports] = useState<HackReport[]>([]);
  const [mannerReports, setMannerReports] = useState<MannerReport[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, searchRes] = await Promise.all([
          fetch(`/api/sa/stats?nexonSn=${nexonSn}`),
          fetch(`/api/search?q=${nexonSn}&type=barracks`),
        ]);

        const statsData = await statsRes.json();
        if (statsData.profile) {
          setStats(statsData);
        } else {
          setNotFound(true);
        }

        const searchData = await searchRes.json();
        setHackReports(searchData.hackReports ?? []);
        setMannerReports(searchData.mannerReports ?? []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [nexonSn]);

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-md px-5 py-8 space-y-4">
        <div className="h-5 w-16 rounded bg-toss-gray-100 dark:bg-toss-gray-800" />
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />)}
      </div>
    );
  }

  if (notFound || !stats) {
    return (
      <div className="mx-auto max-w-screen-md px-5 py-16 text-center">
        <p className="text-[15px] text-toss-gray-500 font-medium">유저를 찾을 수 없습니다</p>
        <Link href="/search" className="text-[13px] text-primary mt-4 inline-block">검색으로 돌아가기</Link>
      </div>
    );
  }

  const { profile, combatPower, playStyle, community } = stats;
  const barracksUrl = `https://barracks.sa.nexon.com/${nexonSn}/match`;
  const styleColor = STYLE_COLORS[playStyle.style] ?? STYLE_COLORS.balanced;

  function handleReport() {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    window.location.href = `/reports/new`;
  }

  return (
    <div className="mx-auto max-w-screen-md px-5 py-8">
      <Link href="/search" className="inline-flex items-center gap-1 text-[13px] text-toss-gray-500 hover:text-foreground transition-colors mb-5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        검색으로
      </Link>

      {/* ─── 프로필 카드 ─── */}
      <div className="bg-card rounded-3xl border border-border/40 shadow-toss overflow-hidden mb-4">
        <div className="px-6 pt-6 pb-5 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center overflow-hidden ring-4 ring-card shadow-toss-md mb-4">
            {profile.userImg ? (
              <img src={profile.userImg} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[28px] font-bold text-toss-gray-500">{profile.nickname.charAt(0)}</span>
            )}
          </div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">{profile.nickname}</h1>
          {profile.clanName && <p className="text-[13px] text-toss-gray-500 mt-1">{profile.clanName}</p>}
          {profile.userIntro && <p className="text-[12px] text-toss-gray-400 mt-2 max-w-xs leading-relaxed">{profile.userIntro}</p>}

          {/* 플레이 스타일 뱃지 */}
          <div className={`mt-4 px-4 py-2 rounded-2xl ${styleColor.bg}`}>
            <span className="text-[13px] font-bold">
              <span className="mr-1.5">{styleColor.icon}</span>
              <span className={styleColor.text}>{playStyle.label}</span>
            </span>
            <p className="text-[11px] text-toss-gray-500 mt-0.5">{playStyle.description}</p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2.5 mt-5">
            <a href={barracksUrl} target="_blank" rel="noopener noreferrer"
              className="h-9 px-5 rounded-full bg-primary/10 text-primary text-[12px] font-semibold flex items-center gap-1.5 transition-all hover:bg-primary/20 active:scale-[0.97]">
              병영수첩
            </a>
            <button onClick={handleReport}
              className="h-9 px-5 rounded-full bg-toss-red/10 text-toss-red text-[12px] font-semibold flex items-center gap-1.5 transition-all hover:bg-toss-red/20 active:scale-[0.97]">
              신고하기
            </button>
          </div>
        </div>

        {/* 기본 스탯 그리드 */}
        <div className="border-t border-border/30">
          <div className="grid grid-cols-4 divide-x divide-border/30">
            {[
              { value: profile.battleInfo?.win_per ?? "-", label: "승률", suffix: "%" },
              { value: profile.battleInfo?.kill_death_per ?? "-", label: "K/D", suffix: "%" },
              { value: profile.battleInfo?.ar_per ?? "-", label: "돌격", suffix: "%" },
              { value: profile.battleInfo?.sr_per ?? "-", label: "저격", suffix: "%" },
            ].map((s) => (
              <div key={s.label} className="py-4 text-center">
                <p className="text-[18px] font-bold tabular-nums text-foreground">{s.value}<span className="text-[12px] text-toss-gray-400">{typeof s.value === 'string' && s.value !== '-' ? s.suffix : ''}</span></p>
                <p className="text-[10px] text-toss-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 계급 정보 */}
        <div className="border-t border-border/30 px-6 py-4">
          <div className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-toss-gray-400">시즌 계급</span>
                <span className="ml-2 font-semibold text-foreground">Lv.{profile.seasonLevel}</span>
              </div>
              <div>
                <span className="text-toss-gray-400">통합 계급</span>
                <span className="ml-2 font-semibold text-foreground">Lv.{profile.level}</span>
              </div>
            </div>
            <div>
              <span className="text-toss-gray-400">전체 랭킹</span>
              <span className="ml-2 font-semibold text-foreground">{profile.totalRankNo}위</span>
              <span className="ml-1 text-toss-gray-400">(상위 {profile.rankPer}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SALog 전투력 ─── */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-toss p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-foreground">SALog 전투력</h2>
          <div className="flex items-center gap-2">
            <span className="text-[28px] font-bold text-primary tabular-nums">{combatPower.total}</span>
            <span className="text-[12px] text-toss-gray-400">/100</span>
          </div>
        </div>
        <div className="space-y-2.5">
          {combatPower.breakdown.map((b) => (
            <CombatPowerBar key={b.label} label={b.label} value={b.value} max={b.max} />
          ))}
        </div>
      </div>

      {/* ─── 커뮤니티 경고 ─── */}
      {(community.blacklistCount > 0 || community.hackReportCount > 0) && (
        <div className="bg-card rounded-2xl border border-border/40 shadow-toss p-5 mb-4">
          <h2 className="text-[15px] font-bold text-foreground mb-3">커뮤니티 경고</h2>
          <div className="flex gap-4">
            {community.blacklistCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-toss-red/5">
                <span className="text-[20px] font-bold text-toss-red tabular-nums">{community.blacklistCount}</span>
                <span className="text-[12px] text-toss-gray-500">명이 경고</span>
              </div>
            )}
            {community.hackReportCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/5">
                <span className="text-[20px] font-bold text-amber-500 tabular-nums">{community.hackReportCount}</span>
                <span className="text-[12px] text-toss-gray-500">건 핵 신고</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SALog 연동: 핵 신고 ─── */}
      <div className="mb-4">
        <h2 className="text-[13px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-2">핵 신고 내역</h2>
        {hackReports.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/20">
            {hackReports.map((r) => {
              const statusInfo = HACK_STATUS_MAP[r.status as keyof typeof HACK_STATUS_MAP];
              return (
                <Link key={r.id} href={`/reports/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-foreground truncate">{r.nickname}</p>
                      {statusInfo && <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span>}
                    </div>
                    <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatDate(r.createdAt)}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-toss-gray-300 shrink-0"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/30 p-5 text-center">
            <p className="text-[13px] text-toss-gray-400">핵 신고 내역이 없습니다</p>
          </div>
        )}
      </div>

      {/* ─── SALog 연동: 비매너 신고 ─── */}
      <div className="mb-4">
        <h2 className="text-[13px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-2">비매너 신고 내역</h2>
        {mannerReports.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/20">
            {mannerReports.map((r) => {
              const types = r.tagTypes?.length ? r.tagTypes : [r.tagType];
              return (
                <Link key={r.id} href={`/manner/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-foreground truncate">{r.nickname}</p>
                      {types.slice(0, 2).map((t) => {
                        const info = MANNER_TAG_MAP[t as keyof typeof MANNER_TAG_MAP] ?? MANNER_TAG_MAP.OTHER;
                        return <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${info.bg} ${info.color}`}>{info.emoji}</span>;
                      })}
                    </div>
                    <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatDate(r.createdAt)}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-toss-gray-300 shrink-0"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/30 p-5 text-center">
            <p className="text-[13px] text-toss-gray-400">비매너 신고 내역이 없습니다</p>
          </div>
        )}
      </div>

      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
    </div>
  );
}
