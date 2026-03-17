"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { LoginPrompt } from "@/components/common/login-prompt";
import { MANNER_TAG_MAP, HACK_STATUS_MAP } from "@/lib/mock-data";

type SALogUser = {
  id: string;
  nickname: string | null;
  image: string | null;
  barracksVerified: boolean;
  barracksAddress: string | null;
  role: string;
};

type BarracksUser = {
  nickname: string;
  nexonSn: number;
  userImg: string | null;
  level: number;
  clanName: string | null;
};

type HackReport = {
  id: string;
  nickname: string;
  status: string;
  hackTypes: string[];
  createdAt: string;
  barracksAddress: string;
};

type MannerReport = {
  id: string;
  nickname: string;
  tagType: string;
  tagTypes: string[];
  createdAt: string;
  barracksAddress: string;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export default function SearchPage() {
  const { isLoggedIn } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [salogUsers, setSalogUsers] = useState<SALogUser[]>([]);
  const [barracksUsers, setBarracksUsers] = useState<BarracksUser[]>([]);
  const [hackReports, setHackReports] = useState<HackReport[]>([]);
  const [mannerReports, setMannerReports] = useState<MannerReport[]>([]);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSalogUsers(data.salogUsers ?? []);
      setBarracksUsers(data.barracksUsers ?? []);
      setHackReports(data.hackReports ?? []);
      setMannerReports(data.mannerReports ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  const hasResults = salogUsers.length > 0 || barracksUsers.length > 0 || hackReports.length > 0 || mannerReports.length > 0;

  return (
    <div className="mx-auto max-w-screen-lg px-5 py-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-foreground">검색</h1>
        <p className="text-[14px] text-toss-gray-500 mt-1">닉네임 또는 병영주소로 검색하세요</p>
      </div>

      {/* 검색바 */}
      <div className="relative mb-6">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="absolute left-4 top-1/2 -translate-y-1/2 text-toss-gray-400">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="닉네임 또는 병영주소 (URL/숫자)"
          className="w-full h-12 pl-11 pr-20 rounded-2xl bg-toss-gray-50 dark:bg-secondary border-none text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-40"
        >
          {loading ? "..." : "검색"}
        </button>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* 결과 없음 */}
      {searched && !loading && !hasResults && (
        <div className="text-center py-16">
          <p className="text-[15px] text-toss-gray-500 font-medium">검색 결과가 없습니다</p>
          <p className="text-[13px] text-toss-gray-400 mt-1">다른 닉네임이나 병영주소로 검색해보세요</p>
        </div>
      )}

      {!loading && hasResults && (
        <div className="space-y-8">

          {/* 서든어택 유저 (병영수첩) */}
          {barracksUsers.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-3">서든어택 유저</h2>
              <div className="bg-card rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/20">
                {barracksUsers.map((user) => (
                  <Link
                    key={user.nexonSn}
                    href={`/search/${user.nexonSn}`}
                    className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {user.userImg ? (
                        <img src={user.userImg} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[15px] font-bold text-toss-gray-500">{user.nickname.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground truncate">{user.nickname}</p>
                      <p className="text-[11px] text-toss-gray-400 mt-0.5">
                        Lv.{user.level}{user.clanName ? ` · ${user.clanName}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-toss-orange/10 text-toss-orange">서든</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* SALog 유저 */}
          {salogUsers.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-3">SALog 유저</h2>
              <div className="bg-card rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/20">
                {salogUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[15px] font-bold text-toss-gray-500">{(user.nickname ?? "?").charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[14px] font-semibold text-foreground truncate">{user.nickname}</p>
                        {user.barracksVerified && (
                          <span className="w-[14px] h-[14px] rounded-full bg-primary flex items-center justify-center shrink-0">
                            <svg width="7" height="7" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">SALog</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 핵 신고 내역 */}
          {hackReports.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-3">핵 신고 내역</h2>
              <div className="bg-card rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/20">
                {hackReports.map((r) => {
                  const statusInfo = HACK_STATUS_MAP[r.status as keyof typeof HACK_STATUS_MAP];
                  return (
                    <Link key={r.id} href={`/reports/${r.id}`} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-secondary/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-semibold text-foreground truncate">{r.nickname}</p>
                          {statusInfo && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatDate(r.createdAt)}</p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-toss-red/10 text-toss-red">핵 신고</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* 비매너 신고 내역 */}
          {mannerReports.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-3">비매너 신고 내역</h2>
              <div className="bg-card rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/20">
                {mannerReports.map((r) => {
                  const types = r.tagTypes?.length ? r.tagTypes : [r.tagType];
                  return (
                    <Link key={r.id} href={`/manner/${r.id}`} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-secondary/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-semibold text-foreground truncate">{r.nickname}</p>
                          {types.slice(0, 2).map((t) => {
                            const info = MANNER_TAG_MAP[t as keyof typeof MANNER_TAG_MAP] ?? MANNER_TAG_MAP.OTHER;
                            return <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${info.bg} ${info.color}`}>{info.emoji} {info.label}</span>;
                          })}
                        </div>
                        <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatDate(r.createdAt)}</p>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-toss-orange/10 text-toss-orange">비매너</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
    </div>
  );
}
