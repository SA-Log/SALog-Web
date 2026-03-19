"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/lib/mock-data";

type ViewItem = { id: string; path: string; ip: string | null; userId: string | null; createdAt: string; referer: string | null };
type TopPage = { path: string; count: number };

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("today");
  const [data, setData] = useState<{ totalViews: number; uniqueVisitors: number; recentViews: ViewItem[]; topPages: TopPage[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  // 30초마다 자동 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/analytics?period=${period}`)
        .then(r => r.json())
        .then(d => setData(d))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [period]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-foreground">방문 통계</h1>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-toss-green animate-pulse" />
          <span className="text-[11px] text-toss-gray-400">30초마다 갱신</span>
        </div>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-1.5 mb-4">
        {[
          { value: "today", label: "오늘" },
          { value: "7d", label: "7일" },
          { value: "30d", label: "30일" },
        ].map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium ${period === p.value ? "bg-primary text-white" : "bg-secondary text-toss-gray-600"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />)}
        </div>
      ) : data ? (
        <>
          {/* 요약 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-4">
              <p className="text-[24px] font-bold text-primary">{data.totalViews.toLocaleString()}</p>
              <p className="text-[11px] text-toss-gray-500 mt-1">페이지뷰</p>
            </div>
            <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-4">
              <p className="text-[24px] font-bold text-toss-green">{data.uniqueVisitors.toLocaleString()}</p>
              <p className="text-[11px] text-toss-gray-500 mt-1">순 방문자</p>
            </div>
          </div>

          {/* 인기 페이지 */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5 mb-6">
            <h2 className="text-[14px] font-semibold text-foreground mb-3">인기 페이지</h2>
            {data.topPages.length > 0 ? (
              <div className="space-y-2">
                {data.topPages.map((p, i) => (
                  <div key={p.path} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[12px] font-bold text-toss-gray-400 w-5 shrink-0">{i + 1}</span>
                      <span className="text-[13px] text-foreground truncate font-mono">{p.path}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-primary tabular-nums shrink-0">{p.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-toss-gray-400 text-center py-4">데이터 없음</p>
            )}
          </div>

          {/* 실시간 로그 */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-foreground">실시간 방문 로그</h2>
              <span className="text-[11px] text-toss-gray-400">최근 50건</span>
            </div>
            {data.recentViews.length > 0 ? (
              <div className="divide-y divide-border/30">
                {data.recentViews.map(v => (
                  <div key={v.id} className="px-5 py-3 flex items-center gap-3 text-[12px]">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-foreground">{v.path}</span>
                      {v.userId && <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">회원</span>}
                    </div>
                    <span className="text-toss-gray-400 shrink-0 tabular-nums">{v.ip?.slice(0, 15)}</span>
                    <span className="text-toss-gray-400 shrink-0">{formatRelativeTime(v.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-toss-gray-400 text-center py-8">방문 기록이 없습니다</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-[13px] text-toss-gray-400 text-center py-12">데이터를 불러올 수 없습니다</p>
      )}
    </div>
  );
}
