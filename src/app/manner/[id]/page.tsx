"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/common/auth-guard";
import { ReportDetailView, type ReportDetailData } from "@/components/common/report-detail-view";

export default function MannerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<ReportDetailData | null>(null);
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
          <div className="h-40 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />
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
        <Link href="/manner" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold btn-primary">목록으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <AuthGuard>
      <ReportDetailView report={report} type="manner" />
    </AuthGuard>
  );
}
