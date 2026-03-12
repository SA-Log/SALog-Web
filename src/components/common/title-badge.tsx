"use client";

import Link from "next/link";
import type { UserTitle, MilitaryRank } from "@/lib/mock-data";

/** 화려한 칭호 뱃지 — 등급별 그라데이션 + 글로우 */
export function TitleBadge({ title, size = "sm" }: { title: UserTitle; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-[11px]",
    lg: "px-2.5 py-1 text-[12px]",
  };

  if (title.tier === "legendary") {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded-md font-bold bg-gradient-to-r ${title.gradient} ${title.glow} text-amber-900 ${sizeClasses[size]} animate-pulse-slow`}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"}>
          <path d="M5 0.5L6.18 3.56L9.5 3.87L7 6.14L7.72 9.5L5 7.88L2.28 9.5L3 6.14L0.5 3.87L3.82 3.56L5 0.5Z" fill="#92400e"/>
        </svg>
        {title.name}
      </span>
    );
  }

  if (title.tier === "epic") {
    return (
      <span className={`inline-flex items-center rounded-md font-bold bg-gradient-to-r ${title.gradient} ${title.glow} text-white ${sizeClasses[size]}`}>
        {title.name}
      </span>
    );
  }

  if (title.tier === "rare") {
    return (
      <span className={`inline-flex items-center rounded-md font-bold bg-gradient-to-r ${title.gradient} ${title.glow} text-white ${sizeClasses[size]}`}>
        {title.name}
      </span>
    );
  }

  if (title.tier === "penalty") {
    return (
      <span className={`inline-flex items-center rounded-md font-medium bg-stone-200 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-700/40 ${sizeClasses[size]}`}>
        {title.name}
      </span>
    );
  }

  if (title.tier === "uncommon") {
    return (
      <span className={`inline-flex items-center rounded-md font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 ${sizeClasses[size]}`}>
        {title.name}
      </span>
    );
  }

  // common
  return (
    <span className={`inline-flex items-center rounded-md font-semibold bg-slate-200 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700/40 ${sizeClasses[size]}`}>
      {title.name}
    </span>
  );
}

const RANK_CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  general:  { bg: "bg-toss-red/15 dark:bg-toss-red/25",       text: "text-toss-red" },
  officer:  { bg: "bg-toss-blue/15 dark:bg-toss-blue/25",     text: "text-toss-blue" },
  nco:      { bg: "bg-toss-green/15 dark:bg-toss-green/25",   text: "text-toss-green" },
  enlisted: { bg: "bg-toss-gray-200 dark:bg-toss-gray-700",   text: "text-toss-gray-700 dark:text-toss-gray-300" },
};

/** 계급 뱃지 — 카테고리별 색상 */
export function RankBadge({ rank, size = "sm" }: { rank: MilitaryRank; size?: "sm" | "md" }) {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-[11px]",
  };

  const style = RANK_CATEGORY_STYLES[rank.category] ?? RANK_CATEGORY_STYLES.enlisted;

  return (
    <span className={`inline-flex items-center rounded font-semibold ${style.bg} ${style.text} ${sizeClasses[size]}`} title={rank.name}>
      {rank.name}
    </span>
  );
}

/** 명중률 + K/D 인라인 표시 */
export function AccuracyBadge({ accuracy, kills, deaths }: { accuracy: number; kills: number; deaths: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px]">
      <svg width="11" height="11" viewBox="0 0 10 10" fill="none" className="opacity-60">
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="0.8"/>
        <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="0.6"/>
        <circle cx="5" cy="5" r="0.5" fill="currentColor"/>
        <line x1="5" y1="0.5" x2="5" y2="2" stroke="currentColor" strokeWidth="0.5"/>
        <line x1="5" y1="8" x2="5" y2="9.5" stroke="currentColor" strokeWidth="0.5"/>
        <line x1="0.5" y1="5" x2="2" y2="5" stroke="currentColor" strokeWidth="0.5"/>
        <line x1="8" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="0.5"/>
      </svg>
      <span className="font-semibold">{accuracy}%</span>
      <span className="text-toss-gray-500">({kills}K/{deaths}D)</span>
    </span>
  );
}

/** 신고자 정보 블록 — 칭호 + 계급 + 명중률 */
export function ReporterInfo({
  name, accuracy, kills, deaths, title, rank, size = "sm", href,
}: {
  name: string; accuracy: number; kills: number; deaths: number;
  title: UserTitle; rank: MilitaryRank; size?: "sm" | "md"; href?: string;
}) {
  const mdContent = (
    <>
      <div className="w-10 h-10 rounded-full bg-toss-gray-200 flex items-center justify-center shrink-0">
        <span className="text-[14px] font-bold text-toss-gray-600">{name.charAt(0)}</span>
      </div>
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[14px] font-semibold text-foreground">{name}</span>
          <RankBadge rank={rank} size="md" />
          <TitleBadge title={title} size="md" />
        </div>
        <div className="mt-0.5">
          <AccuracyBadge accuracy={accuracy} kills={kills} deaths={deaths} />
        </div>
      </div>
    </>
  );

  const smContent = (
    <>
      <div className="w-5 h-5 rounded-full bg-toss-gray-200 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-toss-gray-600">{name.charAt(0)}</span>
      </div>
      <span className="text-[12px] font-semibold text-toss-gray-800 dark:text-toss-gray-700">{name}</span>
      <RankBadge rank={rank} />
      <TitleBadge title={title} />
      <AccuracyBadge accuracy={accuracy} kills={kills} deaths={deaths} />
    </>
  );

  const className = size === "md"
    ? "flex items-center gap-3 hover:opacity-80 transition-opacity"
    : "flex items-center gap-1.5 flex-wrap hover:opacity-80 transition-opacity";

  const content = size === "md" ? mdContent : smContent;

  if (href) {
    return <Link href={href} className={className}>{content}</Link>;
  }
  return <div className={className}>{content}</div>;
}
