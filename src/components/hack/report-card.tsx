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

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

type EvidenceItem = { type: string; url: string; name: string };

function getCardMedia(evidences?: EvidenceItem[] | null, youtubeUrl?: string | null): { type: "image" | "youtube" | "link"; src: string } | null {
  if (!evidences && !youtubeUrl) return null;

  const items = (evidences ?? []) as EvidenceItem[];

  // 1. 첫 번째 스크린샷
  const screenshot = items.find(e => e.type === "screenshot" && e.url);
  if (screenshot) return { type: "image", src: screenshot.url };

  // 2. 유튜브 링크 → 썸네일
  const ytEvidence = items.find(e => e.type === "youtube" && e.url);
  if (ytEvidence) {
    const thumb = getYoutubeThumbnail(ytEvidence.url);
    if (thumb) return { type: "youtube", src: thumb };
  }
  if (youtubeUrl) {
    const thumb = getYoutubeThumbnail(youtubeUrl);
    if (thumb) return { type: "youtube", src: thumb };
  }

  // 3. 기타 링크 → 텍스트로 표시
  const link = items.find(e => e.type === "link" && e.url);
  if (link) return { type: "link", src: link.url };

  return null;
}

interface ReportCardProps {
  report: {
    id: string;
    nickname: string;
    status: string;
    description?: string | null;
    evidences?: EvidenceItem[] | null;
    youtubeUrl?: string | null;
    createdAt: string;
    reporter?: { id: string; nickname: string | null; image: string | null };
    agreeCount?: number;
    unsureCount?: number;
    disagreeCount?: number;
    _count?: { comments: number };
    commentCount?: number;
  };
}

export function ReportCard({ report }: ReportCardProps) {
  const router = useRouter();

  const reporterName = report.reporter?.nickname ?? "유저";
  const reporterId = report.reporter?.id ?? "";
  const agreeCount = report.agreeCount ?? 0;
  const unsureCount = report.unsureCount ?? 0;
  const disagreeCount = report.disagreeCount ?? 0;
  const commentCount = report._count?.comments ?? report.commentCount ?? 0;
  const media = getCardMedia(report.evidences, report.youtubeUrl);

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

        {/* Target nickname */}
        <div className="px-4 sm:px-5 pb-2">
          <h3 className="text-[16px] sm:text-[17px] font-bold text-foreground tracking-tight truncate">{report.nickname}</h3>
        </div>

        {/* Thumbnail */}
        {media && (
          <div className="mx-4 sm:mx-5 mb-2">
            {media.type === "image" && (
              <div className="rounded-2xl overflow-hidden bg-toss-gray-50 dark:bg-toss-gray-800 aspect-[16/9]">
                <img src={media.src} alt="증거" className="w-full h-full object-cover" />
              </div>
            )}
            {media.type === "youtube" && (
              <div className="rounded-2xl overflow-hidden bg-black relative aspect-[16/9]">
                <img src={media.src} alt="YouTube" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg backdrop-blur-sm">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M6 4l6 4-6 4V4z" fill="white"/></svg>
                  </div>
                </div>
              </div>
            )}
            {media.type === "link" && (
              <div className="rounded-xl px-3 py-2.5 bg-toss-gray-50 dark:bg-toss-gray-800 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-toss-gray-400 shrink-0">
                  <path d="M5.5 8.5l3-3M6 10.5l-.75.75a2.5 2.5 0 01-3.54-3.54L3.5 6M8 3.5l.75-.75a2.5 2.5 0 013.54 3.54L10.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span className="text-[12px] text-primary truncate">{media.src}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {report.description && (
          <div className="px-4 sm:px-5 pb-3">
            <p className="text-[13px] text-toss-gray-500 dark:text-toss-gray-400 line-clamp-3 leading-[1.6]">{report.description}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-border/20">
          <div className="flex items-center gap-4 text-[12px]">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-toss-red shrink-0" />
              <span className="font-semibold text-toss-red tabular-nums">{agreeCount}</span>
              <span className="text-toss-gray-400">맞음</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="font-semibold text-amber-500 tabular-nums">{unsureCount}</span>
              <span className="text-toss-gray-400">모름</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-toss-blue shrink-0" />
              <span className="font-semibold text-toss-blue tabular-nums">{disagreeCount}</span>
              <span className="text-toss-gray-400">아님</span>
            </span>
            <span className="inline-flex items-center gap-1 text-toss-gray-400">
              <svg className="shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 5.5a4 4 0 014-4h1a4 4 0 014 4v.5a4 4 0 01-4 4H5L2.5 11.5v-2.3A3.97 3.97 0 011.5 5.5z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="tabular-nums">{commentCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
