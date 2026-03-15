"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/common/auth-guard";
import { useAuth } from "@/providers/auth-provider";
import { MANNER_TAG_MAP } from "@/lib/mock-data";

interface MannerReport {
  id: string;
  nickname: string;
  barracksAddress: string;
  tagType: string;
  tagTypes: string[];
  description: string | null;
  reporterId: string;
  createdAt: string;
  reporter: { id: string; nickname: string | null; image: string | null };
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
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export default function MannerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: authUser } = useAuth();
  const [report, setReport] = useState<MannerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/manner/${id}`)
      .then((res) => {
        if (!res.ok) { setError("게시글을 찾을 수 없습니다"); return null; }
        return res.json();
      })
      .then((data) => { if (data) setReport(data); })
      .catch(() => setError("서버 연결에 실패했습니다"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-screen-lg px-5 py-6">
          <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-toss animate-pulse">
            <div className="h-6 w-32 rounded bg-toss-gray-100 dark:bg-toss-gray-800 mb-3" />
            <div className="h-8 w-48 rounded bg-toss-gray-100 dark:bg-toss-gray-800 mb-4" />
            <div className="h-20 rounded bg-toss-gray-100 dark:bg-toss-gray-800" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !report) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-screen-lg px-5 py-16 text-center">
          <p className="text-[14px] text-toss-gray-400">{error || "게시글을 찾을 수 없습니다"}</p>
          <Link href="/manner" className="text-[13px] text-primary mt-4 inline-block">목록으로 돌아가기</Link>
        </div>
      </AuthGuard>
    );
  }

  const displayTypes = report.tagTypes?.length ? report.tagTypes : [report.tagType];
  const barracksUrl = report.barracksAddress ? `https://barracks.sa.nexon.com/${report.barracksAddress}/match` : null;
  const isAuthor = report.reporterId === authUser?.id;

  return (
    <AuthGuard>
    <div className="mx-auto max-w-screen-lg px-5 py-6">
      <Link href="/manner" className="inline-flex items-center gap-1 text-[13px] text-toss-gray-500 hover:text-foreground transition-colors mb-5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        목록으로
      </Link>

      {/* Main info */}
      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-toss mb-4">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {displayTypes.map((t) => {
            const info = MANNER_TAG_MAP[t as keyof typeof MANNER_TAG_MAP] ?? MANNER_TAG_MAP.OTHER;
            return (
              <span key={t} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${info.bg} ${info.color}`}>
                {info.emoji} {info.label}
              </span>
            );
          })}
        </div>

        <h1 className="text-[22px] font-bold text-foreground">{report.nickname}</h1>

        {barracksUrl && (
          <a href={barracksUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[12px] font-medium hover:bg-primary/20 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            병영수첩 바로가기
          </a>
        )}

        {report.description && (
          <div className="mt-4 p-4 rounded-xl bg-secondary">
            <p className="text-[13px] text-toss-gray-700 dark:text-toss-gray-300 leading-relaxed">{report.description}</p>
          </div>
        )}

        {/* Reporter */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-[11px] text-toss-gray-400 mb-2">신고자</p>
          <Link href={`/profile/${report.reporter.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center overflow-hidden">
              {report.reporter.image ? (
                <img src={report.reporter.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-toss-gray-500">{(report.reporter.nickname ?? "?").charAt(0)}</span>
              )}
            </div>
            <span className="text-[13px] font-semibold text-foreground">{report.reporter.nickname ?? "유저"}</span>
          </Link>
        </div>

        <p className="text-[12px] text-toss-gray-400 mt-3">{formatRelative(report.createdAt)}</p>
      </div>

      <div className="p-4 rounded-xl bg-secondary border border-border">
        <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-500 leading-relaxed text-center">
          비매너 신고는 커뮤니티 기반 참고 정보이며, 공식적인 제재와 무관합니다.
        </p>
      </div>
    </div>
    </AuthGuard>
  );
}
