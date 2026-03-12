"use client";

import { useState } from "react";
import { FloatingActionButton } from "@/components/common/floating-action-button";
import { MannerCard } from "@/components/manner/manner-card";
import { mockMannerTags, type MannerTagType } from "@/lib/mock-data";

type ViewTab = "reports" | "users";

const TAG_FILTERS: { value: MannerTagType | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "VERBAL_ABUSE", label: "🤬 욕설" },
  { value: "BLOCKING", label: "🚧 길막" },
  { value: "GRIEFING", label: "👺 트롤링" },
  { value: "AFK", label: "💤 잠수" },
  { value: "TEAM_KILL", label: "💥 섬광탄 방해" },
  { value: "OTHER", label: "⚠️ 기타" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "votes", label: "동의 많은순" },
  { value: "oldest", label: "오래된순" },
];

// 비매너 유저 DB 등록 조건:
// 1. 동일 병영주소에 대한 신고 2건 이상 (서로 다른 신고자)
// 2. 해당 유저의 전체 투표 합산 10표 이상
// 3. 평균 동의율 60% 이상
function getDbQualifiedTags() {
  // 병영주소별 그룹핑
  const byAddress = new Map<string, typeof mockMannerTags>();
  for (const tag of mockMannerTags) {
    const group = byAddress.get(tag.barracksAddress) || [];
    group.push(tag);
    byAddress.set(tag.barracksAddress, group);
  }

  const qualifiedAddresses = new Set<string>();
  for (const [address, tags] of byAddress) {
    // 조건 1: 서로 다른 신고자 2명 이상
    const uniqueReporters = new Set(tags.map((t) => t.reporterId));
    if (uniqueReporters.size < 2) continue;

    // 조건 2: 전체 투표 합산 10표 이상
    const totalVotes = tags.reduce((sum, t) => sum + t.agreeCount + t.disagreeCount, 0);
    if (totalVotes < 10) continue;

    // 조건 3: 평균 동의율 60% 이상
    const totalAgree = tags.reduce((sum, t) => sum + t.agreeCount, 0);
    const agreeRate = totalVotes > 0 ? (totalAgree / totalVotes) * 100 : 0;
    if (agreeRate < 60) continue;

    qualifiedAddresses.add(address);
  }

  return mockMannerTags.filter((t) => qualifiedAddresses.has(t.barracksAddress));
}

export default function MannerPage() {
  const [viewTab, setViewTab] = useState<ViewTab>("reports");
  const [tagFilter, setTagFilter] = useState<MannerTagType | "ALL">("ALL");
  const [sortBy, setSortBy] = useState("latest");

  const dbTags = getDbQualifiedTags();

  const filtered = mockMannerTags
    .filter((t) => tagFilter === "ALL" || t.tagType === tagFilter)
    .sort((a, b) => {
      if (sortBy === "votes") return b.agreeCount - a.agreeCount;
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const dbFiltered = dbTags
    .filter((t) => tagFilter === "ALL" || t.tagType === tagFilter)
    .sort((a, b) => {
      if (sortBy === "votes") return b.agreeCount - a.agreeCount;
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="mx-auto max-w-screen-lg px-5 py-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-foreground">비매너 신고</h1>
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-500 mt-1">비매너 유저 정보를 참고용으로 공유하는 시스템입니다</p>
      </div>

      {/* Info banner — 탭에 따라 변경 */}
      {viewTab === "reports" ? (
        <div className="bg-primary/5 dark:bg-primary/15 rounded-2xl p-4 mb-5 flex gap-3 items-center border border-primary/10 dark:border-primary/20">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 5.5V8M6 3.5V4M11 6C11 8.76 8.76 11 6 11C3.24 11 1 8.76 1 6C1 3.24 3.24 1 6 1C8.76 1 11 3.24 11 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-primary"/></svg>
          </div>
          <p className="text-[12px] text-primary leading-relaxed">새 신고는 신고 목록에 등록됩니다. 커뮤니티 투표를 통해 검증되며, 조건 충족 시 비매너 유저 DB에 자동 등록됩니다.</p>
        </div>
      ) : (
        <div className="bg-toss-orange/5 dark:bg-toss-orange/10 rounded-2xl p-4 mb-5 flex gap-3 items-center border border-toss-orange/10 dark:border-toss-orange/20">
          <div className="w-5 h-5 rounded-full bg-toss-orange/20 flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 5.5V8M6 3.5V4M11 6C11 8.76 8.76 11 6 11C3.24 11 1 8.76 1 6C1 3.24 3.24 1 6 1C8.76 1 11 3.24 11 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-toss-orange"/></svg>
          </div>
          <p className="text-[12px] text-toss-orange leading-relaxed">서로 다른 신고자 2명 이상, 총 투표 10표 이상, 평균 동의율 60% 이상을 충족한 유저 목록입니다.</p>
        </div>
      )}

      {/* View Tab: 신고 목록 / 비매너 유저 DB */}
      <div className="flex gap-1 mb-5 bg-secondary rounded-xl p-1">
        <button
          onClick={() => setViewTab("reports")}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium btn-chip ${
            viewTab === "reports" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"
          }`}
        >
          신고 목록
          <span className={`ml-1 text-[11px] ${viewTab === "reports" ? "text-primary" : "text-toss-gray-400"}`}>{mockMannerTags.length}</span>
        </button>
        <button
          onClick={() => setViewTab("users")}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium btn-chip ${
            viewTab === "users" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"
          }`}
        >
          비매너 유저 DB
          <span className={`ml-1 text-[11px] ${viewTab === "users" ? "text-toss-orange" : "text-toss-gray-400"}`}>{dbTags.length}</span>
        </button>
      </div>

      {viewTab === "reports" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {TAG_FILTERS.map((f) => (
                <button key={f.value} onClick={() => setTagFilter(f.value)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium btn-chip ${tagFilter === f.value ? "bg-primary text-white" : "bg-secondary text-toss-gray-600"}`}>
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

          <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mb-3">총 <span className="font-semibold text-foreground">{filtered.length}</span>건</p>

          <div className="flex flex-col gap-3">
            {filtered.map((tag) => (
              <MannerCard key={tag.id} tag={tag} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16"><p className="text-[14px] text-toss-gray-400">해당 태그의 신고가 없습니다</p></div>
          )}
        </>
      )}

      {viewTab === "users" && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {TAG_FILTERS.map((f) => (
                <button key={f.value} onClick={() => setTagFilter(f.value)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium btn-chip ${tagFilter === f.value ? "bg-primary text-white" : "bg-secondary text-toss-gray-600"}`}>
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

          <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mb-3">총 <span className="font-semibold text-foreground">{dbFiltered.length}</span>건</p>

          <div className="flex flex-col gap-3">
            {dbFiltered.map((tag) => (
              <MannerCard key={tag.id} tag={tag} />
            ))}
          </div>

          {dbFiltered.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
                  <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-toss-gray-400"/>
                </svg>
              </div>
              <p className="text-[15px] text-foreground font-semibold">조건을 충족한 비매너 유저가 없습니다</p>
              <p className="text-[13px] text-toss-gray-500 mt-1">신고 2건 이상 · 투표 10표 이상 · 동의율 60% 이상</p>
            </div>
          )}
        </>
      )}

      <FloatingActionButton href="/manner/new" label="비매너 신고" color="orange" />

      <div className="mt-8 p-4 rounded-xl bg-secondary border border-border">
        <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-500 leading-relaxed text-center">비매너 신고는 유저 간 참고 정보이며, 공식적인 제재와 무관합니다. 악의적인 허위 등록 시 서비스 이용이 제한될 수 있습니다.</p>
      </div>
    </div>
  );
}
