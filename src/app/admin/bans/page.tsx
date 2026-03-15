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

const BAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  WARNING: { label: "경고", color: "text-amber-600", bg: "bg-amber-500/10" },
  TEMP: { label: "임시 정지", color: "text-toss-red", bg: "bg-toss-red/10" },
  PERMANENT: { label: "영구 정지", color: "text-toss-red", bg: "bg-toss-red/10" },
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

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-1">유저 제재</h1>
      <p className="text-[12px] text-toss-gray-500 mb-4">제재 이력을 확인하고 관리합니다</p>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-toss-gray-400">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchBans()}
            placeholder="닉네임, 병영주소, 사유 검색"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <button onClick={() => fetchBans()} className="h-10 px-4 rounded-xl bg-secondary text-[12px] font-semibold">검색</button>
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {TYPE_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium ${
              typeFilter === f.value ? "bg-toss-red text-white" : "bg-secondary text-toss-gray-600"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-toss-gray-500 mb-3">총 {bans.length}건</p>

      {/* Ban list */}
      {loading ? (
        <div className="p-8 text-center"><p className="text-[13px] text-toss-gray-500 animate-pulse">로딩 중...</p></div>
      ) : bans.length === 0 ? (
        <div className="p-8 text-center"><p className="text-[13px] text-toss-gray-500">제재 이력이 없습니다</p></div>
      ) : (
        <div className="space-y-2">
          {bans.map((ban) => {
            const typeInfo = BAN_LABELS[ban.type];
            const active = isActive(ban);
            const displayName = ban.user?.nickname ?? ban.barracksAddress ?? "알 수 없음";

            return (
              <div key={ban.id} className="bg-card rounded-2xl border border-border/50 shadow-toss p-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                    {ban.user?.image ? (
                      <img src={ban.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[14px] font-bold text-toss-gray-500">{displayName.charAt(0)}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ban.user ? (
                        <Link href={`/profile/${ban.user.id}`} className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors truncate">
                          {displayName}
                        </Link>
                      ) : (
                        <span className="text-[14px] font-semibold text-foreground truncate">{displayName}</span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${typeInfo.bg} ${typeInfo.color}`}>{typeInfo.label}</span>
                      {active && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-toss-red/10 text-toss-red">활성</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-toss-gray-500">
                      <span>{formatDate(ban.createdAt)}</span>
                      {ban.barracksAddress && <span>병영주소: {ban.barracksAddress}</span>}
                      {ban.type === "TEMP" && ban.expiresAt && (
                        <span>만료: {formatDate(ban.expiresAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* 해제 버튼 */}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(ban.id)}
                      disabled={deleting === ban.id}
                      className="shrink-0 h-8 px-3 rounded-lg bg-secondary text-[11px] font-medium text-toss-gray-600 hover:bg-secondary/80 disabled:opacity-50"
                    >
                      {deleting === ban.id ? "..." : "해제"}
                    </button>
                  )}
                </div>

                {/* 사유 */}
                <div className="mt-2.5 ml-[52px]">
                  <p className="text-[12px] text-toss-gray-500 leading-relaxed">{ban.reason}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
