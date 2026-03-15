"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MANNER_TAG_MAP } from "@/lib/mock-data";

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

interface MannerCardProps {
  tag: {
    id: string;
    nickname: string;
    tagType: string;
    description?: string | null;
    createdAt: string;
    reporter?: { id: string; nickname: string | null; image: string | null };
    // mock 호환
    reporterId?: string;
    reporterName?: string;
  };
}

export function MannerCard({ tag }: MannerCardProps) {
  const router = useRouter();
  const info = MANNER_TAG_MAP[tag.tagType as keyof typeof MANNER_TAG_MAP] ?? MANNER_TAG_MAP.OTHER;

  const reporterName = tag.reporter?.nickname ?? tag.reporterName ?? "유저";
  const reporterId = tag.reporter?.id ?? tag.reporterId ?? "";

  return (
    <div
      onClick={() => router.push(`/manner/${tag.id}`)}
      className="block cursor-pointer group"
    >
      <div className="bg-card rounded-3xl border border-border/40 shadow-toss transition-all duration-200 hover:shadow-toss-md hover:-translate-y-0.5 active:scale-[0.99] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 pb-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/profile/${reporterId}`} className="w-9 h-9 rounded-full bg-gradient-to-br from-toss-orange/15 to-amber-400/15 flex items-center justify-center shrink-0 ring-1 ring-border/30 hover:ring-primary/40 transition-all overflow-hidden">
            {tag.reporter?.image ? (
              <img src={tag.reporter.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[12px] font-bold text-toss-orange/80">{reporterName.charAt(0)}</span>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${reporterId}`} className="text-[13px] font-semibold text-foreground truncate hover:underline block">
              {reporterName}
            </Link>
            <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatRelative(tag.createdAt)}</p>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${info.bg} ${info.color}`}>
            {info.emoji} {info.label}
          </span>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-5 pb-3.5">
          <h3 className="text-[16px] sm:text-[17px] font-bold text-foreground tracking-tight truncate mb-1">{tag.nickname}</h3>
          {tag.description && (
            <p className="text-[13px] text-toss-gray-500 dark:text-toss-gray-400 line-clamp-2 leading-[1.6]">{tag.description}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-border/20">
          <span className="text-[11px] text-toss-gray-300 tabular-nums">{formatDateTime(tag.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
