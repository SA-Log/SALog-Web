"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./status-badge";
import { RankBadge, TitleBadge } from "@/components/common/title-badge";
import { type HackReport, formatRelativeTime } from "@/lib/mock-data";

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export function ReportCard({ report }: { report: HackReport }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/reports/${report.id}`)}
      className="block cursor-pointer group"
    >
      <div className="bg-card rounded-3xl border border-border/40 shadow-toss transition-all duration-200 hover:shadow-toss-md hover:-translate-y-0.5 active:scale-[0.99] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 pb-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/profile/${report.reporterId}`} className="w-9 h-9 rounded-full bg-gradient-to-br from-toss-red/15 to-toss-orange/15 flex items-center justify-center shrink-0 ring-1 ring-border/30 hover:ring-primary/40 transition-all">
            <span className="text-[12px] font-bold text-toss-red/80">{report.reporterName.charAt(0)}</span>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link href={`/profile/${report.reporterId}`} className="text-[13px] font-semibold text-foreground truncate hover:underline">
                {report.reporterName}
              </Link>
              <span className="hidden sm:inline-flex"><RankBadge rank={report.reporterRank} /></span>
              <span className="hidden sm:inline-flex"><TitleBadge title={report.reporterTitle} /></span>
            </div>
            <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatRelativeTime(report.createdAt)}</p>
          </div>
          <StatusBadge status={report.status} />
        </div>

        {/* Body */}
        <div className="px-4 sm:px-5 pb-3.5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-foreground tracking-tight truncate">{report.nickname}</h3>
            {report.nicknameHistory.length > 0 && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-toss-orange/8 text-toss-orange text-[10px] font-bold tabular-nums">
                닉변 {report.nicknameHistory.length}
              </span>
            )}
          </div>
          <p className="text-[13px] text-toss-gray-500 dark:text-toss-gray-400 line-clamp-2 leading-[1.6]">{report.description}</p>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[12px] leading-none">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-toss-red shrink-0" />
              <span className="font-semibold text-toss-red tabular-nums">{report.agreeCount}</span>
              <span className="text-toss-gray-400">맞음</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="font-semibold text-amber-500 tabular-nums">{report.unsureCount}</span>
              <span className="text-toss-gray-400">모름</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-toss-blue shrink-0" />
              <span className="font-semibold text-toss-blue tabular-nums">{report.disagreeCount}</span>
              <span className="text-toss-gray-400">아님</span>
            </span>
            <span className="inline-flex items-center gap-1 text-toss-gray-400">
              <svg className="shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 5.5a4 4 0 014-4h1a4 4 0 014 4v.5a4 4 0 01-4 4H5L2.5 11.5v-2.3A3.97 3.97 0 011.5 5.5z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="tabular-nums">{report.commentCount}</span>
            </span>
          </div>
          <span className="text-[11px] text-toss-gray-300 tabular-nums">{formatDateTime(report.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
