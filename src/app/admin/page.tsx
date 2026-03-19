"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAdminRole } from "./layout";
import { HACK_STATUS_MAP, formatRelativeTime } from "@/lib/mock-data";

type DashboardData = {
  stats: { pendingHackCount: number; confirmedHackCount: number; pendingMannerCount: number; totalUsers: number; totalBans: number };
  recentHackReports: { id: string; nickname: string; status: string; hackTypes: string[]; createdAt: string; reporter: { nickname: string | null }; _count: { votes: number; comments: number } }[];
  recentMannerReports: { id: string; nickname: string; status: string; tagTypes: string[]; createdAt: string; reporter: { nickname: string | null } }[];
};

export default function AdminDashboard() {
  const { role } = useAdminRole();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const canSeeUsers = role === "MASTER" || role === "VICE_MASTER" || role === "OPERATOR";

  if (loading) {
    return (
      <div>
        <h1 className="text-[22px] font-bold text-foreground mb-6">관리자 대시보드</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-[13px] text-toss-gray-400 py-12 text-center">데이터를 불러올 수 없습니다</p>;

  const { stats } = data;

  const statsCards = [
    { value: stats.pendingHackCount, label: "핵 검증 대기", color: "text-toss-orange", href: "/admin/reports" },
    { value: stats.confirmedHackCount, label: "핵 확정", color: "text-toss-red", href: "/admin/reports" },
    { value: stats.pendingMannerCount, label: "비매너 검토 대기", color: "text-amber-500", href: "/admin/reports" },
    ...(canSeeUsers ? [{ value: stats.totalUsers, label: "전체 유저", color: "text-foreground", href: "/admin/users" }] : []),
  ];

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-6">관리자 대시보드</h1>

      {/* Stats */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6`}>
        {statsCards.map((s) => (
          <Link key={s.label} href={s.href} className="bg-card rounded-2xl border border-border/50 shadow-toss p-4 hover:shadow-toss-md transition-toss">
            <p className={`text-[24px] font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-toss-gray-500 mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent reports */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* 최근 핵 신고 */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-foreground">최근 핵 신고</h2>
            <Link href="/admin/reports" className="text-[12px] text-primary hover:underline">전체보기</Link>
          </div>
          {data.recentHackReports.length > 0 ? (
            <div className="space-y-2">
              {data.recentHackReports.map((r) => {
                const statusInfo = HACK_STATUS_MAP[r.status as keyof typeof HACK_STATUS_MAP] ?? HACK_STATUS_MAP.SUSPECT;
                return (
                  <Link key={r.id} href={`/reports/${r.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground truncate">{r.nickname}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span>
                      </div>
                      <p className="text-[11px] text-toss-gray-400 mt-0.5">{r.reporter?.nickname ?? "유저"} · {formatRelativeTime(r.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-toss-gray-400 shrink-0">
                      <span>투표 {r._count.votes}</span>
                      <span>댓글 {r._count.comments}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] text-toss-gray-400 text-center py-6">신고가 없습니다</p>
          )}
        </div>

        {/* 최근 비매너 신고 */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-foreground">최근 비매너 신고</h2>
            <Link href="/admin/reports" className="text-[12px] text-primary hover:underline">전체보기</Link>
          </div>
          {data.recentMannerReports.length > 0 ? (
            <div className="space-y-2">
              {data.recentMannerReports.map((r) => (
                <Link key={r.id} href={`/manner/${r.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground truncate">{r.nickname}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.status === "CONFIRMED" ? "bg-toss-red/10 text-toss-red" : r.status === "REJECTED" ? "bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-500" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"}`}>
                        {r.status === "CONFIRMED" ? "확정" : r.status === "REJECTED" ? "반려" : "검토 중"}
                      </span>
                    </div>
                    <p className="text-[11px] text-toss-gray-400 mt-0.5">{r.reporter?.nickname ?? "유저"} · {formatRelativeTime(r.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-toss-gray-400 text-center py-6">신고가 없습니다</p>
          )}
        </div>
      </div>

      {/* Quick summary */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
        <h2 className="text-[14px] font-semibold text-foreground mb-3">요약</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] text-toss-gray-500">핵 검증 대기</p>
            <p className="text-[18px] font-bold text-toss-orange">{stats.pendingHackCount}</p>
          </div>
          <div>
            <p className="text-[11px] text-toss-gray-500">핵 확정</p>
            <p className="text-[18px] font-bold text-toss-red">{stats.confirmedHackCount}</p>
          </div>
          <div>
            <p className="text-[11px] text-toss-gray-500">비매너 검토 대기</p>
            <p className="text-[18px] font-bold text-amber-500">{stats.pendingMannerCount}</p>
          </div>
          <div>
            <p className="text-[11px] text-toss-gray-500">활성 밴</p>
            <p className="text-[18px] font-bold text-foreground">{stats.totalBans}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
