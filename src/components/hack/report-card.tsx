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
      className="block cursor-pointer"
    >
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss hover:shadow-toss-md transition-toss active:scale-[0.99] overflow-hidden">
        {/* Header — 작성자 정보 */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3" onClick={(e) => e.stopPropagation()}>
          <Link href={`/profile/${report.reporterId}`} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-toss-red/20 to-toss-orange/20 flex items-center justify-center shrink-0 ring-2 ring-border/50 hover:ring-primary/30 transition-all">
            <span className="text-[11px] sm:text-[12px] font-bold text-toss-red">{report.reporterName.charAt(0)}</span>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Link href={`/profile/${report.reporterId}`} className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate hover:underline">
                {report.reporterName}
              </Link>
              <span className="hidden sm:inline-flex"><RankBadge rank={report.reporterRank} /></span>
              <span className="hidden sm:inline-flex"><TitleBadge title={report.reporterTitle} /></span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-toss-gray-400">{formatRelativeTime(report.createdAt)}</p>
          </div>
          <StatusBadge status={report.status} />
        </div>

        {/* Body — 신고 대상 + 설명 */}
        <div className="px-3 sm:px-4 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <h3 className="text-[14px] sm:text-[16px] font-bold text-foreground truncate">{report.nickname}</h3>
            {report.nicknameHistory.length > 0 && (
              <span className="shrink-0 inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-toss-orange/10 text-toss-orange text-[10px] sm:text-[11px] font-bold">
                닉변 {report.nicknameHistory.length}회
              </span>
            )}
          </div>
          <p className="text-[12px] sm:text-[13px] text-toss-gray-700 dark:text-toss-gray-300 line-clamp-2 leading-relaxed">{report.description}</p>
        </div>

        {/* Footer — 투표 + 날짜 */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-t border-border/30 flex items-center justify-between text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
            <span className="text-toss-red font-medium">맞음 {report.agreeCount}</span>
            <span className="text-toss-gray-300">&middot;</span>
            <span className="text-amber-500 font-medium">모름 {report.unsureCount}</span>
            <span className="text-toss-gray-300">&middot;</span>
            <span className="text-toss-blue font-medium">아님 {report.disagreeCount}</span>
            <span className="text-toss-gray-300">&middot;</span>
            <span className="text-toss-gray-500 font-medium">{report.commentCount}</span>
          </div>
          <span className="text-toss-gray-400 shrink-0 ml-2">{formatDateTime(report.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
