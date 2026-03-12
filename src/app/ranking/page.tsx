"use client";

import { useState } from "react";
import Link from "next/link";
import { TitleBadge, RankBadge, AccuracyBadge } from "@/components/common/title-badge";
import {
  mockUsers,
  getAccuracyColor,
  getExpProgress,
  USER_TITLES,
  MILITARY_RANKS,
  EXP_TABLE,
} from "@/lib/mock-data";

type SortMode = "accuracy" | "exp" | "kills";

export default function RankingPage() {
  const [sortMode, setSortMode] = useState<SortMode>("accuracy");
  const [showGuide, setShowGuide] = useState(false);

  const sortedUsers = [...mockUsers].sort((a, b) => {
    if (sortMode === "accuracy") return b.accuracy - a.accuracy;
    if (sortMode === "exp") return b.exp - a.exp;
    return b.kills - a.kills;
  });

  const top3 = sortedUsers.slice(0, 3);

  return (
    <div className="mx-auto max-w-screen-lg px-5 py-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-foreground">랭킹</h1>
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-500 mt-1">
          명중률과 경험치로 증명하는 신뢰도
        </p>
      </div>

      {/* Guide toggle */}
      <button
        onClick={() => setShowGuide(!showGuide)}
        className="w-full mb-4 flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 shadow-toss btn-ghost"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="currentColor" strokeWidth="1.5" className="text-primary"/><path d="M9 12V9M9 6H9.0075" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary"/></svg>
          </div>
          <span className="text-[14px] font-semibold text-foreground">랭킹 시스템 가이드</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-300 ${showGuide ? "rotate-180" : ""}`}>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-toss-gray-400"/>
        </svg>
      </button>

      {/* Guide content */}
      {showGuide && (
        <div className="space-y-4 mb-6 animate-in slide-in-from-top-2 duration-300">
          {/* K/D/A System */}
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-toss">
            <h2 className="text-[15px] font-semibold text-foreground mb-4">K / D / A 시스템</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-toss-red/5 dark:bg-toss-red/10 border border-toss-red/10 dark:border-toss-red/20">
                <div className="w-10 h-10 rounded-xl bg-toss-red/10 dark:bg-toss-red/20 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-black text-toss-red">K</span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Kill</p>
                  <p className="text-[12px] text-toss-gray-700 dark:text-toss-gray-400 mt-0.5">내 신고가 <span className="font-semibold text-toss-red">핵 확정</span> 판정을 받으면 Kill +1</p>
                  <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-500 mt-0.5">최초 신고자 +{EXP_TABLE.reporterConfirmed} EXP · 추가 증거 제출자 +{EXP_TABLE.contributorConfirmed} EXP</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-toss-blue/5 dark:bg-toss-blue/10 border border-toss-blue/10 dark:border-toss-blue/20">
                <div className="w-10 h-10 rounded-xl bg-toss-blue/10 dark:bg-toss-blue/20 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-black text-toss-blue">D</span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Death</p>
                  <p className="text-[12px] text-toss-gray-700 dark:text-toss-gray-400 mt-0.5">내 신고가 <span className="font-semibold text-toss-blue">기각</span>되거나 반대표가 더 많으면 Death +1</p>
                  <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-500 mt-0.5">EXP 변동 없음</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-toss-green/5 dark:bg-toss-green/10 border border-toss-green/10 dark:border-toss-green/20">
                <div className="w-10 h-10 rounded-xl bg-toss-green/10 dark:bg-toss-green/20 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-black text-toss-green">A</span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Assist</p>
                  <p className="text-[12px] text-toss-gray-700 dark:text-toss-gray-400 mt-0.5">커뮤니티 활동 참여 시 Assist +1 (명중률에 영향 없음)</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[12px] text-toss-gray-600 dark:text-toss-gray-500">
                    <span>투표 +{EXP_TABLE.vote} EXP</span>
                    <span>댓글 +{EXP_TABLE.comment} EXP</span>
                    <span>추가 증거 확정 +{EXP_TABLE.contributorConfirmed} EXP</span>
                    <span>비매너 신고 +{EXP_TABLE.mannerTag} EXP</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-secondary text-center">
              <p className="text-[14px] font-semibold text-foreground">명중률 = Kill ÷ (Kill + Death) × 100%</p>
              <p className="text-[12px] text-toss-gray-500 mt-1">Assist는 명중률에 영향을 주지 않고, 경험치만 획득합니다</p>
            </div>
          </div>

          {/* Title showcase */}
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-toss">
            <h2 className="text-[15px] font-semibold text-foreground mb-1">칭호 시스템</h2>
            <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mb-4">명중률에 따라 자동으로 부여됩니다</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {USER_TITLES.map((title) => (
                <div key={title.id} className="rounded-xl p-3 text-center bg-secondary border border-border/30">
                  <TitleBadge title={title} size="lg" />
                  <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-500 mt-1.5">
                    {title.minAccuracy > 0 ? `명중률 ${title.minAccuracy}% 이상` : "명중률 30% 미만"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Rank & EXP */}
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-toss">
            <h2 className="text-[15px] font-semibold text-foreground mb-1">계급 & 경험치</h2>
            <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mb-4">넷마블 서든어택의 계급 체계를 기반으로 합니다. 꾸준한 활동으로 계급을 올리세요.</p>

            {/* 병사 */}
            <div className="mb-4">
              <p className="text-[12px] font-semibold text-toss-gray-600 dark:text-toss-gray-400 mb-2">병사</p>
              <div className="grid grid-cols-5 gap-1.5">
                {MILITARY_RANKS.filter((r) => r.category === "enlisted").reverse().map((rank) => (
                  <div key={rank.id} className="rounded-lg p-2 text-center bg-secondary border border-border/30">
                    <RankBadge rank={rank} size="md" />
                    <p className="text-[10px] text-toss-gray-500 mt-0.5">{rank.minExp.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 부사관 */}
            <div className="mb-4">
              <p className="text-[12px] font-semibold text-toss-green mb-2">부사관 (하사 ~ 상사)</p>
              <div className="grid grid-cols-3 gap-1.5">
                {(["하사", "중사", "상사"] as const).map((baseName) => {
                  const ranks = MILITARY_RANKS.filter((r) => r.category === "nco" && r.shortName === baseName);
                  const first = ranks[ranks.length - 1];
                  return (
                    <div key={baseName} className="rounded-lg p-2 text-center bg-toss-green/5 dark:bg-toss-green/10 border border-toss-green/10 dark:border-toss-green/20">
                      <span className="inline-flex items-center rounded font-semibold bg-toss-green/15 dark:bg-toss-green/25 text-toss-green px-2 py-0.5 text-[11px]">{baseName}</span>
                      <p className="text-[10px] text-toss-gray-500 mt-0.5">{ranks.length}호봉</p>
                      <p className="text-[9px] text-toss-gray-400">{(first.minExp / 1000).toLocaleString()}K~</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 장교 */}
            <div className="mb-4">
              <p className="text-[12px] font-semibold text-toss-blue mb-2">장교 (소위 ~ 대령)</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {(["소위", "중위", "대위", "소령", "중령", "대령"] as const).map((baseName) => {
                  const ranks = MILITARY_RANKS.filter((r) => r.category === "officer" && r.shortName === baseName);
                  const first = ranks[ranks.length - 1];
                  return (
                    <div key={baseName} className="rounded-lg p-2 text-center bg-toss-blue/5 dark:bg-toss-blue/10 border border-toss-blue/10 dark:border-toss-blue/20">
                      <span className="inline-flex items-center rounded font-semibold bg-toss-blue/15 dark:bg-toss-blue/25 text-toss-blue px-2 py-0.5 text-[11px]">{baseName}</span>
                      <p className="text-[10px] text-toss-gray-500 mt-0.5">{ranks.length}호봉</p>
                      <p className="text-[9px] text-toss-gray-400">{(first.minExp / 1000).toLocaleString()}K~</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 장성 */}
            <div className="mb-5">
              <p className="text-[12px] font-semibold text-toss-red mb-2">장성 (인원 제한)</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {MILITARY_RANKS.filter((r) => r.category === "general").reverse().map((rank) => (
                  <div key={rank.id} className="rounded-lg p-2 text-center bg-toss-red/5 dark:bg-toss-red/10 border border-toss-red/10 dark:border-toss-red/20">
                    <RankBadge rank={rank} size="md" />
                    <p className="text-[10px] text-toss-gray-500 mt-0.5">{(rank.minExp / 1000).toLocaleString()}K</p>
                    <p className="text-[9px] text-toss-red">{rank.playerLimit?.toLocaleString()}명</p>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-[14px] font-semibold text-foreground mb-3">경험치 획득 방법</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="rounded-xl p-3 bg-secondary border border-border/30">
                <p className="text-[12px] font-semibold text-foreground mb-2">출석</p>
                <div className="space-y-1.5 text-[12px] text-toss-gray-700 dark:text-toss-gray-500">
                  <div className="flex justify-between"><span>매일 출석</span><span className="font-semibold text-primary">+{EXP_TABLE.dailyCheckIn}</span></div>
                  <div className="flex justify-between"><span>3일 연속 보너스</span><span className="font-semibold text-primary">+{EXP_TABLE.streak3}</span></div>
                  <div className="flex justify-between"><span>7일 연속 보너스</span><span className="font-semibold text-primary">+{EXP_TABLE.streak7}</span></div>
                  <div className="flex justify-between"><span>30일 연속 보너스</span><span className="font-semibold text-primary">+{EXP_TABLE.streak30}</span></div>
                  <div className="flex justify-between"><span>90일 연속 보너스</span><span className="font-semibold text-primary">+{EXP_TABLE.streak90}</span></div>
                  <div className="flex justify-between"><span>365일 연속 보너스</span><span className="font-semibold text-primary">+{EXP_TABLE.streak365}</span></div>
                </div>
              </div>
              <div className="rounded-xl p-3 bg-secondary border border-border/30">
                <p className="text-[12px] font-semibold text-foreground mb-2">활동</p>
                <div className="space-y-1.5 text-[12px] text-toss-gray-700 dark:text-toss-gray-500">
                  <div className="flex justify-between"><span>핵 확정 · 최초 신고자</span><span className="font-semibold text-toss-red">+{EXP_TABLE.reporterConfirmed}</span></div>
                  <div className="flex justify-between"><span>핵 확정 · 추가 증거 제출자</span><span className="font-semibold text-toss-red">+{EXP_TABLE.contributorConfirmed}</span></div>
                  <div className="flex justify-between"><span>핵 유력 · 최초 신고자</span><span className="font-semibold text-toss-orange">+{EXP_TABLE.reporterProbable}</span></div>
                  <div className="flex justify-between"><span>핵 유력 · 추가 증거 제출자</span><span className="font-semibold text-toss-orange">+{EXP_TABLE.contributorProbable}</span></div>
                  <div className="flex justify-between"><span>투표 참여 (Assist)</span><span className="font-semibold text-toss-green">+{EXP_TABLE.vote}</span></div>
                  <div className="flex justify-between"><span>댓글 작성 (Assist)</span><span className="font-semibold text-toss-green">+{EXP_TABLE.comment}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-1 mb-5 bg-secondary rounded-xl p-1">
        {([
          { value: "accuracy" as SortMode, label: "명중률순" },
          { value: "exp" as SortMode, label: "경험치순" },
          { value: "kills" as SortMode, label: "킬 수순" },
        ]).map((tab) => (
          <button key={tab.value} onClick={() => setSortMode(tab.value)}
            className={`flex-1 py-2 rounded-lg text-[13px] font-medium btn-chip ${
              sortMode === tab.value ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[top3[1], top3[0], top3[2]].filter(Boolean).map((user, i) => {
          const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
          const isFirst = actualRank === 1;
          const emoji = actualRank === 1 ? "🥇" : actualRank === 2 ? "🥈" : "🥉";
          const { progress } = getExpProgress(user.exp);

          return (
            <Link key={user.id} href={`/profile/${user.id}`}
              className={`bg-card rounded-2xl border border-border/50 shadow-toss p-4 text-center hover:opacity-80 transition-opacity ${isFirst ? "shadow-toss-md -mt-2" : "mt-2"}`}>
              <span className="text-[24px]">{emoji}</span>
              <div className={`w-12 h-12 rounded-full mx-auto mt-2 flex items-center justify-center ring-2 ${
                isFirst ? "ring-amber-400 bg-amber-50 dark:bg-amber-950" : "ring-toss-gray-200 bg-toss-gray-100"
              }`}>
                <span className={`text-[16px] font-bold ${isFirst ? "text-amber-600 dark:text-amber-400" : "text-toss-gray-500"}`}>{user.name.charAt(0)}</span>
              </div>
              <p className="text-[14px] font-semibold text-foreground mt-2 truncate">{user.name}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <RankBadge rank={user.rank} />
                <TitleBadge title={user.title} />
              </div>
              <p className={`text-[16px] font-bold mt-2 ${getAccuracyColor(user.accuracy)}`}>
                {user.accuracy}%
              </p>
              <div className="flex justify-center gap-2 text-[11px] text-toss-gray-500 mt-0.5">
                <span className="text-toss-red">{user.kills}K</span>
                <span>/</span>
                <span className="text-toss-blue">{user.deaths}D</span>
                <span>/</span>
                <span className="text-toss-green">{user.assists}A</span>
              </div>
              {/* EXP bar */}
              <div className="mt-2">
                <div className="h-1 rounded-full bg-toss-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
                <p className="text-[11px] text-toss-gray-500 mt-0.5">{user.exp.toLocaleString()} EXP</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Full list */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">전체 랭킹</h2>
          <span className="text-[12px] text-toss-gray-500">{sortedUsers.length}명</span>
        </div>
        {sortedUsers.map((user, i) => {
          const rankNum = i + 1;
          const emoji = rankNum === 1 ? "🥇" : rankNum === 2 ? "🥈" : rankNum === 3 ? "🥉" : null;
          const { progress } = getExpProgress(user.exp);

          return (
            <Link key={user.id} href={`/profile/${user.id}`}
              className={`flex items-center gap-3 px-5 py-4 ${i < sortedUsers.length - 1 ? "border-b border-border/30" : ""} hover:bg-secondary transition-toss`}>
              <div className="w-8 text-center shrink-0">
                {emoji ? <span className="text-[18px]">{emoji}</span> : <span className="text-[14px] font-bold text-toss-gray-400">{rankNum}</span>}
              </div>
              <div className="w-10 h-10 rounded-full bg-toss-gray-200 flex items-center justify-center shrink-0">
                <span className="text-[14px] font-bold text-toss-gray-500">{user.name.charAt(0)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[14px] font-semibold text-foreground truncate">{user.name}</span>
                  <RankBadge rank={user.rank} />
                  <TitleBadge title={user.title} />
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[12px] text-toss-gray-500">
                  <AccuracyBadge accuracy={user.accuracy} kills={user.kills} deaths={user.deaths} />
                  <span className="text-toss-green">{user.assists}A</span>
                  <span>{user.exp.toLocaleString()} EXP</span>
                  {user.streak >= 3 && <span className="text-toss-orange">🔥 {user.streak}일</span>}
                </div>
                {/* Tiny EXP bar */}
                <div className="mt-1 h-0.5 w-24 rounded-full bg-toss-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-primary/50" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-[18px] font-bold ${getAccuracyColor(user.accuracy)}`}>{user.accuracy}%</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
