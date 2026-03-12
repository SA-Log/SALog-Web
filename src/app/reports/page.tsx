"use client";

import { useState } from "react";
import { FloatingActionButton } from "@/components/common/floating-action-button";
import { ReportCard } from "@/components/hack/report-card";
import { mockHackReports, type HackStatus } from "@/lib/mock-data";

type MainTab = "reports" | "confirmed";

const REPORT_FILTERS: { value: HackStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "PROBABLE", label: "핵 유력" },
  { value: "SUSPECT", label: "핵 의심" },
  { value: "DISMISSED", label: "기각" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "votes", label: "찬성 많은순" },
  { value: "oldest", label: "오래된순" },
];

export default function ReportsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("reports");
  const [statusFilter, setStatusFilter] = useState<HackStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState("latest");

  // 핵 의심 등록 탭: 의심, 유력, 기각 (검증 중인 신고)
  const pendingReports = mockHackReports
    .filter((r) => r.status !== "CONFIRMED")
    .filter((r) => statusFilter === "ALL" || r.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === "votes") return b.agreeCount - a.agreeCount;
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // 핵 유저 DB 탭: 확정된 유저만
  const confirmedReports = mockHackReports
    .filter((r) => r.status === "CONFIRMED")
    .sort((a, b) => {
      if (sortBy === "votes") return b.agreeCount - a.agreeCount;
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const pendingCount = mockHackReports.filter((r) => r.status !== "CONFIRMED").length;
  const confirmedCount = mockHackReports.filter((r) => r.status === "CONFIRMED").length;

  return (
    <div className="mx-auto max-w-screen-lg px-5 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-foreground">핵 유저</h1>
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-500 mt-1">
          커뮤니티가 함께 검증하는 서든어택 핵 유저 데이터베이스
        </p>
      </div>

      {/* Info banner — 탭에 따라 변경 */}
      {mainTab === "reports" ? (
        <div className="bg-toss-orange-light dark:bg-toss-orange/10 rounded-2xl p-4 mb-5 flex gap-3 items-center">
          <div className="w-5 h-5 rounded-full bg-toss-orange/20 flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 5.5V8M6 3.5V4M11 6C11 8.76 8.76 11 6 11C3.24 11 1 8.76 1 6C1 3.24 3.24 1 6 1C8.76 1 11 3.24 11 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-toss-orange"/></svg>
          </div>
          <p className="text-[12px] text-toss-orange leading-relaxed">
            새 신고는 &quot;핵 의심&quot;으로 등록됩니다. 커뮤니티 투표와 관리자 검토를 거쳐 상태가 변경됩니다.
          </p>
        </div>
      ) : (
        <div className="bg-toss-red-light dark:bg-toss-red/10 rounded-2xl p-4 mb-5 flex gap-3 items-center">
          <div className="w-5 h-5 rounded-full bg-toss-red/20 flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 5.5V8M6 3.5V4M11 6C11 8.76 8.76 11 6 11C3.24 11 1 8.76 1 6C1 3.24 3.24 1 6 1C8.76 1 11 3.24 11 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-toss-red"/></svg>
          </div>
          <p className="text-[12px] text-toss-red leading-relaxed">
            관리자 최종 승인을 거쳐 핵 사용이 확정된 유저 목록입니다. 닉네임 변경 시 자동 추적됩니다.
          </p>
        </div>
      )}

      {/* Main tabs */}
      <div className="flex gap-1 mb-5 bg-secondary rounded-xl p-1">
        <button
          onClick={() => { setMainTab("reports"); setStatusFilter("ALL"); }}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium btn-chip ${
            mainTab === "reports" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"
          }`}
        >
          핵 의심 등록
          <span className={`ml-1 text-[11px] ${mainTab === "reports" ? "text-toss-orange" : "text-toss-gray-400"}`}>
            {pendingCount}
          </span>
        </button>
        <button
          onClick={() => setMainTab("confirmed")}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium btn-chip ${
            mainTab === "confirmed" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"
          }`}
        >
          핵 유저 DB
          <span className={`ml-1 text-[11px] ${mainTab === "confirmed" ? "text-toss-red" : "text-toss-gray-400"}`}>
            {confirmedCount}
          </span>
        </button>
      </div>

      {/* ========== 핵 의심 등록 탭 ========== */}
      {mainTab === "reports" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {REPORT_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium btn-chip ${
                    statusFilter === f.value
                      ? "bg-primary text-white"
                      : "bg-secondary text-toss-gray-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="sm:ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 sm:h-8 px-3 rounded-lg border border-border bg-card text-[13px] sm:text-[12px] text-toss-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mb-3">
            총 <span className="font-semibold text-foreground">{pendingReports.length}</span>건
          </p>

          <div className="flex flex-col gap-3">
            {pendingReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>

          {pendingReports.length === 0 && (
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
          )}
        </>
      )}

      {/* ========== 핵 유저 DB 탭 ========== */}
      {mainTab === "confirmed" && (
        <>
          {/* Sort only (no status filter needed for confirmed) */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500">
              확정 <span className="font-semibold text-foreground">{confirmedReports.length}</span>명
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 px-3 rounded-lg border border-border bg-card text-[12px] text-toss-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3">
            {confirmedReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>

          {confirmedReports.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
                  <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-toss-gray-400"/>
                </svg>
              </div>
              <p className="text-[15px] text-foreground font-semibold">아직 확정된 핵 유저가 없습니다</p>
            </div>
          )}
        </>
      )}

      <FloatingActionButton href="/reports/new" label="핵 신고" color="red" />

      {/* Disclaimer */}
      <div className="mt-8 p-4 rounded-xl bg-secondary border border-border">
        <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-500 leading-relaxed text-center">
          본 목록은 커뮤니티 기반 정보로, SALog는 정보의 정확성을 보장하지 않습니다.
          모든 핵 판정은 증거 기반으로 이루어지며, 관리자 최종 승인을 거칩니다.
        </p>
      </div>
    </div>
  );
}
