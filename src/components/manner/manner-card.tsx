"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RankBadge, TitleBadge } from "@/components/common/title-badge";
import { type MannerTag, MANNER_TAG_MAP, formatRelativeTime } from "@/lib/mock-data";

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export function MannerCard({ tag }: { tag: MannerTag }) {
  const router = useRouter();
  const info = MANNER_TAG_MAP[tag.tagType];

  return (
    <div
      onClick={() => router.push(`/manner/${tag.id}`)}
      className="block cursor-pointer"
    >
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss hover:shadow-toss-md transition-toss active:scale-[0.99] overflow-hidden">
        {/* Header — 작성자 정보 */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3" onClick={(e) => e.stopPropagation()}>
          <Link href={`/profile/${tag.reporterId}`} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-toss-orange/20 to-amber-400/20 flex items-center justify-center shrink-0 ring-2 ring-border/50 hover:ring-primary/30 transition-all">
            <span className="text-[11px] sm:text-[12px] font-bold text-toss-orange">{tag.reporterName.charAt(0)}</span>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Link href={`/profile/${tag.reporterId}`} className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate hover:underline">
                {tag.reporterName}
              </Link>
              <span className="hidden sm:inline-flex"><RankBadge rank={tag.reporterRank} /></span>
              <span className="hidden sm:inline-flex"><TitleBadge title={tag.reporterTitle} /></span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-toss-gray-400">{formatRelativeTime(tag.createdAt)}</p>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold ${info.bg} ${info.color}`}>
            {info.emoji} {info.label}
          </span>
        </div>

        {/* Body — 신고 대상 + 설명 */}
        <div className="px-3 sm:px-4 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <h3 className="text-[14px] sm:text-[16px] font-bold text-foreground truncate">{tag.nickname}</h3>
            {tag.nicknameHistory.length > 0 && (
              <span className="shrink-0 inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-toss-orange/10 text-toss-orange text-[10px] sm:text-[11px] font-bold">
                닉변 {tag.nicknameHistory.length}회
              </span>
            )}
          </div>
          <p className="text-[12px] sm:text-[13px] text-toss-gray-700 dark:text-toss-gray-300 line-clamp-2 leading-relaxed">{tag.description}</p>
        </div>

        {/* Footer — 투표 + 날짜 */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-t border-border/30 flex items-center justify-between text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <span className="text-toss-green font-medium">동의 {tag.agreeCount}</span>
            <span className="text-toss-gray-300">&middot;</span>
            <span className="text-toss-red font-medium">반대 {tag.disagreeCount}</span>
            <span className="text-toss-gray-300">&middot;</span>
            <span className="text-toss-gray-500 font-medium">{tag.commentCount}</span>
          </div>
          <span className="text-toss-gray-400 shrink-0 ml-2">{formatDateTime(tag.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
