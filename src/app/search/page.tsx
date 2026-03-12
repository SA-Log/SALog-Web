"use client";

import { useState } from "react";
import Link from "next/link";
import { ReportCard } from "@/components/hack/report-card";
import { MannerCard } from "@/components/manner/manner-card";
import { AuthGuard } from "@/components/common/auth-guard";
import { mockHackReports, mockMannerTags } from "@/lib/mock-data";

interface SAUserResult {
  found: boolean;
  ouid?: string;
  error?: string;
  basic?: {
    user_name: string;
    user_date_create: string;
    title_name: string | null;
    clan_name: string | null;
    manner_grade: string | null;
  };
  rank?: {
    grade: string;
    grade_exp: number;
    grade_ranking: number;
    season_grade: string;
    season_grade_exp: number;
    season_grade_ranking: number;
  };
}

type Tab = "sa" | "hack" | "manner";

const MANNER_COLORS: Record<string, { bg: string; text: string }> = {
  "매우 좋음": { bg: "bg-toss-green/10 dark:bg-toss-green/20", text: "text-toss-green" },
  "좋음":     { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
  "보통":     { bg: "bg-secondary", text: "text-toss-gray-600 dark:text-toss-gray-400" },
  "나쁨":     { bg: "bg-toss-orange/10 dark:bg-toss-orange/20", text: "text-toss-orange" },
  "매우 나쁨": { bg: "bg-toss-red/10 dark:bg-toss-red/20", text: "text-toss-red" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatExp(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.floor(n / 10000).toLocaleString()}만`;
  return n.toLocaleString();
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("sa");
  const [isSearching, setIsSearching] = useState(false);
  const [saResult, setSaResult] = useState<SAUserResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [isBarracksSearch, setIsBarracksSearch] = useState(false);

  const [copied, setCopied] = useState(false);
  const trimmed = query.trim().toLowerCase();

  // SALog 내부 검색 (mock)
  const hackResults = trimmed
    ? mockHackReports.filter(
        (r) =>
          r.nickname.toLowerCase().includes(trimmed) ||
          r.barracksAddress.toLowerCase().includes(trimmed)
      )
    : [];
  const mannerResults = trimmed
    ? mockMannerTags.filter(
        (t) =>
          t.nickname.toLowerCase().includes(trimmed) ||
          t.barracksAddress.toLowerCase().includes(trimmed)
      )
    : [];

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setSearched(true);

    const qLower = q.toLowerCase();

    // 병영주소 패턴 감지: https://barracks.sa.nexon.com/{number}/{match|detail|workmanship|saduo}
    const isBarracksQuery = /^https?:\/\/barracks\.sa\.nexon\.com\/\d+/.test(trimmed);

    if (isBarracksQuery) {
      setIsBarracksSearch(true);
      setSaResult(null);
      // 핵 신고/비매너에서 결과가 있는 탭으로 자동 전환
      if (hackResults.length > 0) setActiveTab("hack");
      else if (mannerResults.length > 0) setActiveTab("manner");
      else setActiveTab("hack");
      return;
    }

    setIsBarracksSearch(false);

    setIsSearching(true);
    setSaResult(null);
    try {
      const res = await fetch(`/api/sa/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSaResult(data);
      // SA에서 못 찾았으면 결과 있는 탭으로 자동 전환
      if (!data.found) {
        const hacks = mockHackReports.filter(
          (r) => r.nickname.toLowerCase().includes(qLower) || r.barracksAddress.toLowerCase().includes(qLower)
        );
        const manners = mockMannerTags.filter(
          (t) => t.nickname.toLowerCase().includes(qLower) || t.barracksAddress.toLowerCase().includes(qLower)
        );
        if (hacks.length > 0) setActiveTab("hack");
        else if (manners.length > 0) setActiveTab("manner");
      } else {
        setActiveTab("sa");
      }
    } catch {
      setSaResult({ found: false, error: "네트워크 오류가 발생했습니다" });
    } finally {
      setIsSearching(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function handleClear() {
    setQuery("");
    setSearched(false);
    setSaResult(null);
    setIsBarracksSearch(false);
  }

  const mannerStyle = saResult?.basic?.manner_grade
    ? MANNER_COLORS[saResult.basic.manner_grade] ?? MANNER_COLORS["보통"]
    : null;

  const recentHacks = mockHackReports.slice(0, 3);
  const recentManners = mockMannerTags.slice(0, 3);

  return (
    <AuthGuard>
    <div className="mx-auto max-w-screen-lg px-5 py-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-foreground">검색</h1>
        <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-500 mt-1">
          서든어택 닉네임 또는 병영주소로 검색하세요
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-toss-gray-400">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="닉네임 또는 병영주소 입력"
            className="w-full h-12 pl-11 pr-10 rounded-2xl bg-card border border-border text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 shadow-toss transition-toss"
            autoFocus
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-toss-gray-300 dark:bg-toss-gray-500 flex items-center justify-center btn-ghost"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1L7 7M1 7L7 1" strokeWidth="1.5" stroke="white" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="h-12 px-4 sm:px-6 rounded-2xl bg-primary text-white text-[14px] font-semibold disabled:opacity-40 btn-primary shrink-0"
        >
          {isSearching ? "검색 중..." : "검색"}
        </button>
      </div>

      {/* Searched state */}
      {searched ? (
        <>
          {/* 병영주소 검색 안내 */}
          {isBarracksSearch && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-primary shrink-0">
                <path d="M8 1v9M8 12.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400">
                병영주소 검색은 SALog에 등록된 <span className="font-semibold text-foreground">핵 신고</span>와 <span className="font-semibold text-foreground">비매너 신고</span> 내역만 검색됩니다.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-secondary rounded-xl p-1">
            {!isBarracksSearch && (
              <button onClick={() => setActiveTab("sa")}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium btn-chip ${activeTab === "sa" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"}`}>
                서든어택 {saResult?.found ? <span className="ml-1 text-primary">1</span> : <span className="ml-1 text-toss-gray-400">0</span>}
              </button>
            )}
            <button onClick={() => setActiveTab("hack")}
              className={`flex-1 py-2 rounded-lg text-[13px] font-medium btn-chip ${activeTab === "hack" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"}`}>
              핵 신고 <span className={`ml-1 ${activeTab === "hack" ? "text-primary" : "text-toss-gray-400"}`}>{hackResults.length}</span>
            </button>
            <button onClick={() => setActiveTab("manner")}
              className={`flex-1 py-2 rounded-lg text-[13px] font-medium btn-chip ${activeTab === "manner" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"}`}>
              비매너 <span className={`ml-1 ${activeTab === "manner" ? "text-primary" : "text-toss-gray-400"}`}>{mannerResults.length}</span>
            </button>
          </div>

          {/* SA Tab */}
          {activeTab === "sa" && (
            <>
              {isSearching ? (
                <div className="text-center py-16">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-[13px] text-toss-gray-500">서든어택 서버에서 조회 중...</p>
                </div>
              ) : saResult?.found && saResult.basic ? (
                <div className="space-y-4">
                  {/* Profile card */}
                  <Link href={`/search/player?ouid=${saResult.ouid}&name=${encodeURIComponent(saResult.basic.user_name)}`}
                    className="block bg-card rounded-2xl border border-border/50 shadow-toss overflow-hidden hover:shadow-toss-md transition-shadow">
                    <div className="h-16 sm:h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
                      <div className="absolute -bottom-5 sm:-bottom-6 left-4 sm:left-5">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-card border-3 sm:border-4 border-card shadow-toss flex items-center justify-center">
                          <span className="text-[18px] sm:text-[24px] font-bold text-primary">{saResult.basic.user_name.charAt(0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-7 sm:pt-8 px-4 sm:px-5 pb-4 sm:pb-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="text-[20px] font-bold text-foreground">{saResult.basic.user_name}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            {saResult.basic.clan_name && (
                              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold">
                                {saResult.basic.clan_name}
                              </span>
                            )}
                            {saResult.basic.title_name && (
                              <span className="text-[12px] text-toss-gray-500 dark:text-toss-gray-400">
                                {saResult.basic.title_name}
                              </span>
                            )}
                          </div>
                        </div>
                        {saResult.basic.manner_grade && mannerStyle && (
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${mannerStyle.bg} ${mannerStyle.text}`}>
                            매너 {saResult.basic.manner_grade}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-toss-gray-500 dark:text-toss-gray-400 mt-3">
                        가입일 {formatDate(saResult.basic.user_date_create)}
                      </p>
                    </div>
                  </Link>

                  {/* Rank info */}
                  {saResult.rank && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-4">
                        <p className="text-[11px] text-toss-gray-500 dark:text-toss-gray-400 mb-2">통합 계급</p>
                        <p className="text-[18px] font-bold text-foreground">{saResult.rank.grade}</p>
                        <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400 mt-1">
                          EXP {formatExp(saResult.rank.grade_exp)}
                        </p>
                        <p className="text-[11px] text-toss-gray-500 mt-2">{saResult.rank.grade_ranking.toLocaleString()}위</p>
                      </div>
                      <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-4">
                        <p className="text-[11px] text-toss-gray-500 dark:text-toss-gray-400 mb-2">시즌 계급</p>
                        <p className="text-[18px] font-bold text-foreground">{saResult.rank.season_grade}</p>
                        <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400 mt-1">
                          EXP {formatExp(saResult.rank.season_grade_exp)}
                        </p>
                        <p className="text-[11px] text-toss-gray-500 mt-2">{saResult.rank.season_grade_ranking.toLocaleString()}위</p>
                      </div>
                    </div>
                  )}

                  {/* SALog actions */}
                  <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
                    <p className="text-[13px] font-semibold text-foreground mb-3">SALog 연동</p>
                    <div className="space-y-2">
                      <button onClick={() => setActiveTab("hack")}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-toss-gray-100 dark:hover:bg-toss-gray-700 transition-toss btn-ghost">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-toss-red/10 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M7 1V13M1 7H13" stroke="#f04452" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <span className="text-[13px] font-medium text-foreground">핵 신고 내역 조회</span>
                          <span className="text-[11px] text-toss-gray-400">{hackResults.length}건</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-toss-gray-400">
                          <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button onClick={() => setActiveTab("manner")}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-toss-gray-100 dark:hover:bg-toss-gray-700 transition-toss btn-ghost">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-toss-orange/10 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M7 4.5V7.5M7 9.5V10M1.5 7C1.5 3.96 3.96 1.5 7 1.5S12.5 3.96 12.5 7 10.04 12.5 7 12.5 1.5 10.04 1.5 7Z" stroke="#f59f00" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <span className="text-[13px] font-medium text-foreground">비매너 신고 조회</span>
                          <span className="text-[11px] text-toss-gray-400">{mannerResults.length}건</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-toss-gray-400">
                          <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <Link href="/reports/new"
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-toss-gray-100 dark:hover:bg-toss-gray-700 transition-toss btn-ghost">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M3 7.5L6 10.5L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
                            </svg>
                          </div>
                          <span className="text-[13px] font-medium text-foreground">이 유저 신고하기</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-toss-gray-400">
                          <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(saResult.basic!.user_name);
                        setCopied(true);
                        setTimeout(() => {
                          setCopied(false);
                          window.open(`https://barracks.sa.nexon.com/search?searchType=user&searchText=${encodeURIComponent(saResult.basic!.user_name)}`, "_blank");
                        }, 1200);
                      }}
                      className="text-[12px] text-toss-gray-500 dark:text-toss-gray-400 hover:text-primary transition-toss cursor-pointer">
                      넥슨 병영수첩에서 검색 →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-toss-gray-400">
                      <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M8.5 9.5L13.5 13.5M13.5 9.5L8.5 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-[15px] font-semibold text-foreground mb-1">서든어택 유저를 찾을 수 없습니다</p>
                  <p className="text-[13px] text-toss-gray-500 dark:text-toss-gray-400">
                    {saResult?.error ?? "닉네임을 다시 확인해주세요"}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Hack Tab */}
          {activeTab === "hack" && (
            <>
              <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mb-3">
                &quot;{query.trim()}&quot; 검색 결과 <span className="font-semibold text-foreground">{hackResults.length}</span>건
              </p>
              <div className="flex flex-col gap-3">
                {hackResults.length > 0 ? (
                  hackResults.map((report) => <ReportCard key={report.id} report={report} />)
                ) : (
                  <EmptyResult />
                )}
              </div>
            </>
          )}

          {/* Manner Tab */}
          {activeTab === "manner" && (
            <>
              <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mb-3">
                &quot;{query.trim()}&quot; 검색 결과 <span className="font-semibold text-foreground">{mannerResults.length}</span>건
              </p>
              <div className="flex flex-col gap-3">
                {mannerResults.length > 0 ? (
                  mannerResults.map((tag) => <MannerCard key={tag.id} tag={tag} />)
                ) : (
                  <EmptyResult />
                )}
              </div>
            </>
          )}
        </>
      ) : (
        /* Default empty state */
        <div>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z" stroke="currentColor" strokeWidth="2" className="text-toss-gray-400"/>
                <path d="M21 21L15.8 15.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-toss-gray-400"/>
              </svg>
            </div>
            <p className="text-[15px] text-foreground font-semibold">서든어택 유저 검색</p>
            <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mt-1">
              닉네임을 입력하면 서든어택 서버에서 실시간으로 조회합니다
            </p>
          </div>

          <div className="mb-8">
            <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mb-3 font-semibold">추천 검색어</p>
            <div className="flex flex-wrap gap-2">
              {["지올", "ProGamer_99", "그림자킬러", "무적전사"].map((term) => (
                <button key={term} onClick={() => setQuery(term)}
                  className="px-3.5 py-2 rounded-xl bg-card border border-border text-[13px] font-medium text-toss-gray-700 dark:text-toss-gray-300 btn-chip shadow-toss">
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[14px] font-semibold text-foreground">최근 핵 유저 신고</p>
              <Link href="/reports" className="text-[12px] text-primary hover:underline">전체보기</Link>
            </div>
            <div className="flex flex-col gap-3">
              {recentHacks.map((report) => <ReportCard key={report.id} report={report} />)}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[14px] font-semibold text-foreground">최근 비매너 신고</p>
              <Link href="/manner" className="text-[12px] text-primary hover:underline">전체보기</Link>
            </div>
            <div className="flex flex-col gap-3">
              {recentManners.map((tag) => <MannerCard key={tag.id} tag={tag} />)}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 rounded-xl bg-secondary border border-border">
        <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-500 leading-relaxed text-center">
          유저 정보는 넥슨 오픈 API를 통해 조회됩니다. 데이터는 30일 주기로 갱신됩니다.
        </p>
      </div>

      {/* 닉네임 복사 완료 팝업 */}
      {copied && saResult?.basic && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-card rounded-2xl p-6 shadow-toss-lg border border-border/50 text-center animate-in zoom-in-95 duration-200 mx-4">
            <div className="w-12 h-12 rounded-full bg-toss-green/10 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12L10 17L19 7" stroke="#30b87e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-[16px] font-bold text-foreground">{saResult.basic.user_name}</p>
            <p className="text-[14px] text-toss-green font-semibold mt-1">복사 완료!</p>
            <p className="text-[12px] text-toss-gray-500 mt-2">병영수첩 페이지로 이동합니다...</p>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}

function EmptyResult() {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
          <path d="M7 13C7 13 8.25 11.5 10 11.5C11.75 11.5 13 13 13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
          <circle cx="7.5" cy="7.5" r="0.75" fill="currentColor" className="text-toss-gray-400"/>
          <circle cx="12.5" cy="7.5" r="0.75" fill="currentColor" className="text-toss-gray-400"/>
        </svg>
      </div>
      <p className="text-[15px] text-foreground font-semibold">검색 결과가 없습니다</p>
      <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mt-1">다른 검색어로 시도해보세요</p>
    </div>
  );
}
