"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ROLE_MAP, type UserRole } from "@/lib/mock-data";
import { useAdminRole } from "../layout";

type AdminUser = {
  id: string;
  nickname: string | null;
  role: UserRole;
  image: string | null;
  barracksVerified: boolean;
  barracksAddress: string | null;
  createdAt: string;
  bans: {
    type: string;
    reason: string;
    expiresAt: string | null;
    createdAt: string;
  }[];
};

const ROLE_FILTERS: { value: UserRole | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "MASTER", label: "마스터" },
  { value: "VICE_MASTER", label: "부마스터" },
  { value: "OPERATOR", label: "운영진" },
  { value: "VERIFIED_CREATOR", label: "인증 크리에이터" },
  { value: "USER", label: "일반" },
];

const BAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  WARNING: { label: "경고", color: "text-amber-600", bg: "bg-amber-500/10" },
  TEMP: { label: "임시 정지", color: "text-toss-red", bg: "bg-toss-red/10" },
  PERMANENT: { label: "영구 정지", color: "text-toss-red", bg: "bg-toss-red/10" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 30) return `${days}일 전`;
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminUsersPage() {
  const { role: myRole } = useAdminRole();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");

  const isMaster = myRole === "MASTER";

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function handleSearch() {
    fetchUsers();
  }

  function getActiveBan(user: AdminUser) {
    const ban = user.bans[0];
    if (!ban) return null;
    if (ban.type === "WARNING") return { ...ban, active: false };
    if (ban.type === "PERMANENT") return { ...ban, active: true };
    if (ban.expiresAt && new Date(ban.expiresAt) > new Date()) return { ...ban, active: true };
    return { ...ban, active: false };
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-2">유저 관리</h1>
      <p className="text-[12px] text-toss-gray-500 mb-4">가입한 유저 목록을 확인하고 관리합니다</p>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-toss-gray-400">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="닉네임 또는 ID로 검색"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={handleSearch}
          className="h-10 px-4 rounded-xl bg-secondary text-[12px] font-semibold text-toss-gray-700 dark:text-toss-gray-300"
        >
          검색
        </button>
      </div>

      {/* Role filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {ROLE_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setRoleFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium ${
              roleFilter === f.value ? "bg-primary text-white" : "bg-secondary text-toss-gray-600"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-toss-gray-500 mb-3">총 {users.length}명</p>

      {/* User list */}
      {loading ? (
        <div className="p-8 text-center">
          <p className="text-[13px] text-toss-gray-500 animate-pulse">로딩 중...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-[13px] text-toss-gray-500">유저가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const roleInfo = ROLE_MAP[user.role] ?? ROLE_MAP.USER;
            const displayName = user.nickname ?? "알 수 없음";
            const activeBan = getActiveBan(user);

            return (
              <div key={user.id} className="bg-card rounded-2xl border border-border/50 shadow-toss p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                    {user.image ? (
                      <img src={user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[14px] font-bold text-toss-gray-500">{displayName.charAt(0)}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={`/profile/${user.id}`} className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors truncate">
                        {displayName}
                      </Link>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${roleInfo.bg} ${roleInfo.color}`}>{roleInfo.label}</span>
                      {user.barracksVerified && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-toss-green/10 text-toss-green">인증</span>
                      )}
                      {activeBan?.active && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${BAN_LABELS[activeBan.type]?.bg} ${BAN_LABELS[activeBan.type]?.color}`}>
                          {BAN_LABELS[activeBan.type]?.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-toss-gray-500">
                      <span>{formatDate(user.createdAt)} 가입</span>
                      {user.barracksAddress && <span>병영주소: {user.barracksAddress}</span>}
                    </div>
                  </div>

                  {/* 제재 바로가기 */}
                  <Link
                    href="/admin/bans"
                    className="shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    title="유저 제재"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" className="text-toss-gray-500"/>
                      <path d="M4.5 4.5l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-toss-gray-500"/>
                    </svg>
                  </Link>
                </div>

                {/* 최근 제재 정보 */}
                {activeBan && (
                  <div className={`mt-3 rounded-xl p-3 ${activeBan.active ? "bg-toss-red/5 border border-toss-red/10" : "bg-amber-500/5 border border-amber-500/10"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${BAN_LABELS[activeBan.type]?.bg} ${BAN_LABELS[activeBan.type]?.color}`}>
                        {BAN_LABELS[activeBan.type]?.label}
                      </span>
                      <span className="text-[11px] text-toss-gray-400">{formatDate(activeBan.createdAt)}</span>
                    </div>
                    <p className="text-[12px] text-toss-gray-500">{activeBan.reason}</p>
                    {activeBan.type === "TEMP" && activeBan.expiresAt && (
                      <p className="text-[11px] text-toss-gray-400 mt-1">만료: {new Date(activeBan.expiresAt).toLocaleDateString("ko-KR")}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
