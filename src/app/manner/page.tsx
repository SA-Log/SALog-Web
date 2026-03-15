"use client";

import { useState, useEffect } from "react";
import { FloatingActionButton } from "@/components/common/floating-action-button";
import { MannerCard } from "@/components/manner/manner-card";
import { type MannerTagType } from "@/lib/mock-data";

const TAG_FILTERS: { value: MannerTagType | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "VERBAL_ABUSE", label: "욕설" },
  { value: "BLOCKING", label: "길막" },
  { value: "GRIEFING", label: "트롤링" },
  { value: "AFK", label: "잠수" },
  { value: "TEAM_KILL", label: "섬광탄 방해" },
  { value: "OTHER", label: "기타" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
];

type MannerItem = {
  id: string;
  nickname: string;
  barracksAddress: string;
  tagType: string;
  tagTypes: string[];
  description: string | null;
  createdAt: string;
  reporter: { id: string; nickname: string | null; image: string | null };
};

export default function MannerPage() {
  const [tagFilter, setTagFilter] = useState<MannerTagType | "ALL">("ALL");
  const [sortBy, setSortBy] = useState("latest");
  const [reports, setReports] = useState<MannerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, [tagFilter, sortBy]);

  async function fetchReports() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: sortBy });
      if (tagFilter !== "ALL") params.set("tagType", tagFilter);
      const res = await fetch(`/api/manner?${params}`);
      const data = await res.json();
      setReports(data.reports ?? []);
      setTotal(data.total ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-screen-lg px-5 py-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-foreground">비매너 신고</h1>
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-500 mt-1">비매너 유저 정보를 참고용으로 공유하는 시스템입니다</p>
      </div>

      <div className="bg-primary/5 dark:bg-primary/15 rounded-2xl p-4 mb-5 flex gap-3 items-center border border-primary/10 dark:border-primary/20">
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 5.5V8M6 3.5V4M11 6C11 8.76 8.76 11 6 11C3.24 11 1 8.76 1 6C1 3.24 3.24 1 6 1C8.76 1 11 3.24 11 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-primary"/></svg>
        </div>
        <p className="text-[12px] text-primary leading-relaxed">비매너 신고는 유저 간 참고 정보이며, 공식적인 제재와 무관합니다.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {TAG_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setTagFilter(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium ${tagFilter === f.value ? "bg-primary text-white" : "bg-secondary text-toss-gray-600"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="h-10 sm:h-8 px-3 rounded-lg border border-border bg-card text-[13px] sm:text-[12px] text-toss-gray-700 outline-none focus:ring-2 focus:ring-primary/20">
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mb-3">총 <span className="font-semibold text-foreground">{total}</span>건</p>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card rounded-3xl border border-border/40 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 rounded bg-toss-gray-100 dark:bg-toss-gray-800" />
                  <div className="h-2.5 w-14 rounded bg-toss-gray-100 dark:bg-toss-gray-800" />
                </div>
              </div>
              <div className="h-5 w-32 rounded bg-toss-gray-100 dark:bg-toss-gray-800 mb-2" />
              <div className="h-3 w-48 rounded bg-toss-gray-100 dark:bg-toss-gray-800" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
              <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-toss-gray-400"/>
            </svg>
          </div>
          <p className="text-[15px] text-foreground font-semibold">해당 조건의 신고가 없습니다</p>
          <p className="text-[13px] text-toss-gray-500 mt-1">필터를 변경하거나 새 신고를 등록해주세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <MannerCard key={report.id} tag={report} />
          ))}
        </div>
      )}

      <FloatingActionButton href="/manner/new" label="비매너 신고" color="orange" />

      <div className="mt-8 p-4 rounded-xl bg-secondary border border-border">
        <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-500 leading-relaxed text-center">비매너 신고는 유저 간 참고 정보이며, 공식적인 제재와 무관합니다. 악의적인 허위 등록 시 서비스 이용이 제한될 수 있습니다.</p>
      </div>
    </div>
  );
}
