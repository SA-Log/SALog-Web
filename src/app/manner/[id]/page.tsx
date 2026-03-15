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
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const d = new Date(dateStr);
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
      <div className="mx-auto max-w-screen-lg px-5 py-6">
        <div className="h-5 w-16 rounded-md bg-toss-gray-100 dark:bg-toss-gray-800 mb-5" />
        <div className="space-y-4">
          <div className="h-28 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />
          <div className="h-20 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-screen-lg px-5 py-24 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 8V15M14 19V19.5" stroke="#b0b8c1" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="14" cy="14" r="12" stroke="#b0b8c1" strokeWidth="2" />
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-toss-gray-600 dark:text-toss-gray-400 mb-1">{error || "게시글을 찾을 수 없습니다"}</p>
        <p className="text-[13px] text-toss-gray-400 mb-6">존재하지 않거나 삭제된 게시글입니다</p>
        <Link href="/manner" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold btn-primary">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const displayTypes = report.tagTypes?.length ? report.tagTypes : [report.tagType];
  const barracksUrl = report.barracksAddress ? `https://barracks.sa.nexon.com/${report.barracksAddress}/match` : null;
  const isAuthor = report.reporterId === authUser?.id;

  return (
    <AuthGuard>
    <div className="mx-auto max-w-screen-lg px-5 py-6 pb-12">
      {/* Navigation + Author actions */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/manner" className="inline-flex items-center gap-1 text-[13px] text-toss-gray-500 hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          목록으로
        </Link>
        {isAuthor && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { /* TODO: 편집 모달 */ }}
              className="h-8 px-3 rounded-lg text-[12px] font-medium text-toss-gray-500 hover:text-foreground hover:bg-secondary transition-colors"
            >
              편집
            </button>
            <button
              onClick={async () => {
                if (!confirm("이 게시글을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
                const res = await fetch(`/api/manner/${id}`, { method: "DELETE" });
                if (res.ok) window.location.href = "/manner";
                else alert("삭제에 실패했습니다");
              }}
              className="h-8 px-3 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* ─── Reported User (피신고자) ─── */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-toss p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-toss-orange/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 6C7.1 6 8 5.1 8 4S7.1 2 6 2 4 2.9 4 4 4.9 6 6 6ZM6 7C4.67 7 2 7.67 2 9V10H10V9C10 7.67 7.33 7 6 7Z" fill="#f59f00"/>
            </svg>
          </div>
          <span className="text-[12px] font-semibold text-toss-orange">신고 대상</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-toss-orange/8 dark:bg-toss-orange/15 flex items-center justify-center shrink-0">
            <span className="text-[22px] font-bold text-toss-orange">{report.nickname.charAt(0)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] sm:text-[24px] font-bold text-foreground tracking-tight truncate">{report.nickname}</h1>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {displayTypes.map((t) => {
                const info = MANNER_TAG_MAP[t as keyof typeof MANNER_TAG_MAP] ?? MANNER_TAG_MAP.OTHER;
                return (
                  <span key={t} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium leading-none ${info.bg} ${info.color}`}>
                    <span className="text-[10px] leading-none">{info.emoji}</span>
                    <span className="leading-none">{info.label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {barracksUrl && (
          <a href={barracksUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-xl bg-primary/5 dark:bg-primary/10 text-[12px] font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            병영수첩 바로가기
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 7L7 3M7 3H4M7 3V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        )}
      </div>

      {/* ─── Reporter (신고자) ─── */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-toss p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-toss-blue/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 6C7.1 6 8 5.1 8 4S7.1 2 6 2 4 2.9 4 4 4.9 6 6 6ZM6 7C4.67 7 2 7.67 2 9V10H10V9C10 7.67 7.33 7 6 7Z" fill="#3182f6"/>
              </svg>
            </div>
            <span className="text-[12px] font-semibold text-toss-blue">신고자</span>
          </div>
          <span className="text-[11px] text-toss-gray-400">{formatRelative(report.createdAt)}</span>
        </div>
        <Link
          href={authUser?.id === report.reporter.id ? "/profile" : `/profile/${report.reporter.id}`}
          className="flex items-center gap-3 mt-3 p-2.5 -mx-1 rounded-xl hover:bg-secondary transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 overflow-hidden flex items-center justify-center ring-2 ring-toss-blue/20 group-hover:ring-toss-blue/40 transition-all shrink-0">
            {report.reporter.image ? (
              <img src={report.reporter.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[14px] font-bold text-toss-gray-500">{(report.reporter.nickname || "?").charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {report.reporter.nickname || "익명"}
            </p>
            <p className="text-[11px] text-toss-gray-400">프로필 보기</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-toss-gray-300 dark:text-toss-gray-600 shrink-0">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      {/* ─── Description ─── */}
      {report.description && (
        <div className="bg-card rounded-2xl border border-border/40 shadow-toss mb-4">
          <div className="p-5">
            <h2 className="text-[15px] font-semibold text-foreground mb-3">신고 사유</h2>
            <p className="text-[14px] text-toss-gray-700 dark:text-toss-gray-300 leading-[1.7]">{report.description}</p>
          </div>
        </div>
      )}

      {/* ─── Vote (placeholder) ─── */}
      <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-toss mb-4">
        <h2 className="text-[15px] font-semibold text-foreground mb-5">커뮤니티 투표</h2>
        <p className="text-[13px] text-toss-gray-400 text-center py-4">투표 기능은 준비 중입니다</p>
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-secondary border border-border">
        <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-500 leading-relaxed text-center">
          비매너 신고는 커뮤니티 기반 참고 정보이며, 공식적인 제재와 무관합니다.
        </p>
      </div>
    </div>
    </AuthGuard>
  );
}
