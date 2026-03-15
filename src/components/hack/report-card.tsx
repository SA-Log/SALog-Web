"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./status-badge";

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function formatRelative(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return formatDateTime(dateStr);
}

interface ReportCardProps {
  report: {
    id: string;
    nickname: string;
    status: string;
    hackTypes?: string[];
    description?: string | null;
    createdAt: string;
    reporter?: { id: string; nickname: string | null; image: string | null };
    _count?: { votes: number; comments: number };
    // mock 호환
    reporterId?: string;
    reporterName?: string;
    agreeCount?: number;
    unsureCount?: number;
    disagreeCount?: number;
    commentCount?: number;
  };
}

export function ReportCard({ report }: ReportCardProps) {
  const router = useRouter();

  const reporterName = report.reporter?.nickname ?? report.reporterName ?? "유저";
  const reporterId = report.reporter?.id ?? report.reporterId ?? "";
  const voteCount = report._count?.votes ?? ((report.agreeCount ?? 0) + (report.unsureCount ?? 0) + (report.disagreeCount ?? 0));
  const commentCount = report._count?.comments ?? report.commentCount ?? 0;

  return (
    <div
      onClick={() => router.push(`/reports/${report.id}`)}
      className="block cursor-pointer group"
    >
      <div className="bg-card rounded-3xl border border-border/40 shadow-toss transition-all duration-200 hover:shadow-toss-md hover:-translate-y-0.5 active:scale-[0.99] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 pb-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/profile/${reporterId}`} className="w-9 h-9 rounded-full bg-gradient-to-br from-toss-red/15 to-toss-orange/15 flex items-center justify-center shrink-0 ring-1 ring-border/30 hover:ring-primary/40 transition-all overflow-hidden">
            {report.reporter?.image ? (
              <img src={report.reporter.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[12px] font-bold text-toss-red/80">{reporterName.charAt(0)}</span>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${reporterId}`} className="text-[13px] font-semibold text-foreground truncate hover:underline block">
              {reporterName}
            </Link>
            <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatRelative(report.createdAt)}</p>
          </div>
          <StatusBadge status={report.status} />
        </div>

        {/* Body */}
        <div className="px-4 sm:px-5 pb-3.5">
          <h3 className="text-[16px] sm:text-[17px] font-bold text-foreground tracking-tight truncate mb-1">{report.nickname}</h3>
          {report.description && (
            <p className="text-[13px] text-toss-gray-500 dark:text-toss-gray-400 line-clamp-2 leading-[1.6]">{report.description}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[12px] leading-none">
            <span className="inline-flex items-center gap-1 text-toss-gray-500">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4 6 1z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
              <span className="tabular-nums">{voteCount}</span>
              <span>투표</span>
            </span>
            <span className="inline-flex items-center gap-1 text-toss-gray-500">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 5.5a4 4 0 014-4h1a4 4 0 014 4v.5a4 4 0 01-4 4H5L2.5 11.5v-2.3A3.97 3.97 0 011.5 5.5z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="tabular-nums">{commentCount}</span>
            </span>
          </div>
          <span className="text-[11px] text-toss-gray-300 tabular-nums">{formatDateTime(report.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
