"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAdminRole } from "../layout";

type Ban = {
  id: string;
  userId: string | null;
  barracksAddress: string | null;
  reason: string;
  type: "WARNING" | "TEMP" | "PERMANENT";
  expiresAt: string | null;
  bannedBy: string;
  createdAt: string;
  user: { id: string; nickname: string | null; barracksAddress: string | null; image: string | null } | null;
};

const TYPE_FILTERS = [
  { value: "ALL", label: "전체" },
  { value: "WARNING", label: "경고" },
  { value: "TEMP", label: "임시 정지" },
  { value: "PERMANENT", label: "영구 정지" },
];

const BAN_CHIP: Record<string, { label: string; text: string; bg: string; dot: string }> = {
  WARNING: { label: "경고", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15", dot: "bg-amber-500" },
  TEMP: { label: "임시 정지", text: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/15", dot: "bg-orange-500" },
  PERMANENT: { label: "영구 정지", text: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/15", dot: "bg-red-500" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function isActive(ban: Ban) {
  if (ban.type === "WARNING") return false;
  if (ban.type === "PERMANENT") return true;
  if (ban.expiresAt && new Date(ban.expiresAt) > new Date()) return true;
  return false;
}

export default function BansPage() {
  const { role: myRole } = useAdminRole();
  const canDelete = myRole === "MASTER" || myRole === "VICE_MASTER";

  const [bans, setBans] = useState<Ban[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchBans(); }, [typeFilter]);

  async function fetchBans() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/ban?${params}`);
      const data = await res.json();
      if (data.bans) setBans(data.bans);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleDelete(banId: string) {
    if (!confirm("이 제재를 해제하시겠습니까?")) return;
    setDeleting(banId);
    try {
      const res = await fetch("/api/admin/ban", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banId }),
      });
      if (res.ok) fetchBans();
      else alert("해제에 실패했습니다");
    } catch { alert("서버 연결에 실패했습니다"); }
    finally { setDeleting(null); }
  }

  // 카테고리별 카운트
  const counts = {
    ALL: bans.length,
    WARNING: bans.filter(b => b.type === "WARNING").length,
    TEMP: bans.filter(b => b.type === "TEMP").length,
    PERMANENT: bans.filter(b => b.type === "PERMANENT").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-foreground tracking-tight">유저 제재</h1>
        <p className="text-[13px] text-toss-gray-500 mt-0.5">제재 이력을 확인하고 관리합니다</p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-toss-gray-400">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchBans()}
          placeholder="닉네임, 병영주소, 사유 검색"
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-toss-gray-50 dark:bg-secondary border-none text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {/* Segmented Control */}
      <div className="bg-toss-gray-50 dark:bg-secondary rounded-2xl p-1 flex gap-0.5">
        {TYPE_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all ${
              typeFilter === f.value
                ? "bg-card text-foreground shadow-sm"
                : "text-toss-gray-500 hover:text-foreground"
            }`}>
            {f.label}
            <span className="ml-1 text-[10px] opacity-60">{counts[f.value as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-[12px] text-toss-gray-400 tabular-nums">{bans.length}건의 제재</p>

      {/* Ban list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card rounded-2xl border border-border/40 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800" />
                  <div className="h-3 w-40 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : bans.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-toss-gray-50 dark:bg-secondary flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-toss-gray-300">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[14px] text-toss-gray-500 font-medium">제재 이력이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {bans.map((ban) => {
            const chip = BAN_CHIP[ban.type];
            const active = isActive(ban);
            const displayName = ban.user?.nickname ?? ban.barracksAddress ?? "알 수 없음";

            return (
              <div key={ban.id} className="bg-card rounded-2xl border border-border/40 shadow-toss overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3.5">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {ban.user?.image ? (
                        <img src={ban.user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[15px] font-bold text-toss-gray-500">{displayName.charAt(0)}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ban.user ? (
                          <Link href={`/profile/${ban.user.id}`} className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors truncate">
                            {displayName}
                          </Link>
                        ) : (
                          <span className="text-[14px] font-semibold text-foreground truncate">{displayName}</span>
                        )}
                        {/* 제재 유형 칩 */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${chip.bg} ${chip.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
                          {chip.label}
                        </span>
                        {active && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white">활성</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="text-toss-gray-400">{formatDate(ban.createdAt)} 제재</span>
                        {ban.type === "TEMP" && ban.expiresAt && (
                          <>
                            <span className="text-toss-gray-300">→</span>
                            <span className={`font-medium ${new Date(ban.expiresAt) > new Date() ? "text-orange-500" : "text-toss-gray-400"}`}>
                              {formatDate(ban.expiresAt)} 만료
                            </span>
                          </>
                        )}
                        {ban.type === "PERMANENT" && (
                          <span className="font-medium text-red-500">무기한</span>
                        )}
                      </div>
                    </div>

                    {/* 해제 */}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(ban.id)}
                        disabled={deleting === ban.id}
                        className="shrink-0 h-8 px-3.5 rounded-xl bg-toss-gray-50 dark:bg-toss-gray-800 text-[11px] font-semibold text-toss-gray-600 dark:text-toss-gray-400 hover:bg-toss-gray-100 dark:hover:bg-toss-gray-700 disabled:opacity-50 transition-colors"
                      >
                        {deleting === ban.id ? "..." : "해제"}
                      </button>
                    )}
                  </div>

                  {/* 사유 */}
                  <div className="mt-3 ml-[56px]">
                    <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">{ban.reason}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
