"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./status-badge";
import { RankBadge, TitleBadge } from "@/components/common/title-badge";
import { type HackReport, formatRelativeTime } from "@/lib/mock-data";

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} \u00B7 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export function ReportCard({ report }: { report: HackReport }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/reports/${report.id}`)}
      className="block cursor-pointer"
    >
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss hover:shadow-toss-md transition-toss active:scale-[0.99] overflow-hidden">
        {/* Header — 인스타그램 스타일 작성자 정보 */}
        <div className="flex items-center gap-3 px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <Link href={`/profile/${report.reporterId}`} className="w-9 h-9 rounded-full bg-gradient-to-br from-toss-red/20 to-toss-orange/20 flex items-center justify-center shrink-0 ring-2 ring-border/50 hover:ring-primary/30 transition-all">
            <span className="text-[12px] font-bold text-toss-red">{report.reporterName.charAt(0)}</span>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link href={`/profile/${report.reporterId}`} className="text-[13px] font-semibold text-foreground truncate hover:underline">
                {report.reporterName}
              </Link>
              <RankBadge rank={report.reporterRank} />
              <TitleBadge title={report.reporterTitle} />
            </div>
            <p className="text-[11px] text-toss-gray-400">{formatRelativeTime(report.createdAt)}</p>
          </div>
          <StatusBadge status={report.status} />
        </div>

        {/* Body — 신고 대상 + 설명 */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-[16px] font-bold text-foreground truncate">{report.nickname}</h3>
            {report.nicknameHistory.length > 0 && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-toss-orange/10 text-toss-orange text-[11px] font-bold">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 3.5H9.5M7.5 1.5L9.5 3.5L7.5 5.5M9.5 7.5H1.5M3.5 5.5L1.5 7.5L3.5 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                닉변 {report.nicknameHistory.length}회
              </span>
            )}
          </div>
          <p className="text-[13px] text-toss-gray-700 dark:text-toss-gray-300 line-clamp-2 leading-relaxed">{report.description}</p>
        </div>

        {/* Footer — 왼쪽: 투표 상세 / 오른쪽: 작성일 */}
        <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-toss-red font-medium">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M4 6l1.5 1.5L8 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              핵 맞음 {report.agreeCount}
            </span>
            <span className="text-toss-gray-300">&middot;</span>
            <span className="flex items-center gap-1 text-amber-500 font-medium">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 4v2.5M6 8.5h.005" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              모르겠음 {report.unsureCount}
            </span>
            <span className="text-toss-gray-300">&middot;</span>
            <span className="flex items-center gap-1 text-toss-blue font-medium">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M4 4l4 4M8 4l-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              아님 {report.disagreeCount}
            </span>
            <span className="text-toss-gray-300">&middot;</span>
            <span className="flex items-center gap-1 text-toss-gray-500 font-medium">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10.5 6c0 2.071-1.866 3.75-4.167 3.75-.493 0-.966-.07-1.406-.198L2.5 10.5l.908-1.817C2.842 7.858 2.5 6.883 2.5 5.833c0-2.071 1.866-3.75 4.167-3.75S10.833 3.763 10.833 5.833" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {report.commentCount}
            </span>
          </div>
          <span className="text-toss-gray-400 shrink-0 ml-3">{formatDateTime(report.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
