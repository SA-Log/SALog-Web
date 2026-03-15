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

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "USER", label: "일반" },
  { value: "OPERATOR", label: "운영진" },
  { value: "VICE_MASTER", label: "부마스터" },
  { value: "VERIFIED_CREATOR", label: "크리에이터" },
];

const BAN_OPTIONS = [
  { value: "WARNING", label: "경고" },
  { value: "TEMP_7", label: "7일 정지" },
  { value: "TEMP_30", label: "30일 정지" },
  { value: "TEMP_90", label: "90일 정지" },
  { value: "PERMANENT", label: "영구 정지" },
];

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
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  // 역할 변경
  const [roleChanging, setRoleChanging] = useState<string | null>(null);

  // 제재
  const [banTarget, setBanTarget] = useState<string | null>(null);
  const [banType, setBanType] = useState("WARNING");
  const [banReason, setBanReason] = useState("");
  const [banSubmitting, setBanSubmitting] = useState(false);
  const [banError, setBanError] = useState("");

  const isMaster = myRole === "MASTER";
  const canDirectAction = myRole === "MASTER" || myRole === "VICE_MASTER";
  const isOperator = myRole === "OPERATOR";

  useEffect(() => { fetchUsers(); }, [roleFilter]);

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

  async function handleRoleChange(userId: string, newRole: string) {
    setRoleChanging(userId);
    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || "역할 변경에 실패했습니다");
        return;
      }
      fetchUsers();
    } catch {
      alert("서버 연결에 실패했습니다");
    } finally {
      setRoleChanging(null);
    }
  }

  async function handleBanSubmit(userId: string) {
    if (!banReason.trim()) { setBanError("사유를 입력해주세요"); return; }
    setBanSubmitting(true);
    setBanError("");

    let type = "WARNING";
    let expiresAt: string | undefined;
    if (banType.startsWith("TEMP_")) {
      type = "TEMP";
      const days = Number(banType.split("_")[1]);
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    } else {
      type = banType;
    }

    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          barracksAddress: users.find(u => u.id === userId)?.barracksAddress || undefined,
          reason: banReason.trim(),
          type,
          expiresAt,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setBanError(data?.error || "제재에 실패했습니다"); return; }
      setBanTarget(null);
      setBanReason("");
      setBanType("WARNING");
      fetchUsers();
    } catch {
      setBanError("서버 연결에 실패했습니다");
    } finally {
      setBanSubmitting(false);
    }
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
      <h1 className="text-[22px] font-bold text-foreground mb-1">유저 관리</h1>
      <p className="text-[12px] text-toss-gray-500 mb-4">유저 역할 변경, 제재를 관리합니다</p>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-toss-gray-400">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            placeholder="닉네임 또는 ID로 검색"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <button onClick={() => fetchUsers()} className="h-10 px-4 rounded-xl bg-secondary text-[12px] font-semibold">검색</button>
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
        <div className="p-8 text-center"><p className="text-[13px] text-toss-gray-500 animate-pulse">로딩 중...</p></div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center"><p className="text-[13px] text-toss-gray-500">유저가 없습니다</p></div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const roleInfo = ROLE_MAP[user.role] ?? ROLE_MAP.USER;
            const displayName = user.nickname ?? "알 수 없음";
            const activeBan = getActiveBan(user);
            const isExpanded = actionUserId === user.id;
            const isBanning = banTarget === user.id;

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

                  {/* 액션 토글 */}
                  {user.role !== "MASTER" && (
                    <button
                      onClick={() => { setActionUserId(isExpanded ? null : user.id); setBanTarget(null); setBanError(""); }}
                      className="shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="3" r="1" fill="currentColor" className="text-toss-gray-500"/>
                        <circle cx="7" cy="7" r="1" fill="currentColor" className="text-toss-gray-500"/>
                        <circle cx="7" cy="11" r="1" fill="currentColor" className="text-toss-gray-500"/>
                      </svg>
                    </button>
                  )}
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

                {/* ─── 액션 패널 ─── */}
                {isExpanded && user.role !== "MASTER" && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-4">

                    {/* 역할 변경 — 마스터만 */}
                    {isMaster && (
                      <div>
                        <p className="text-[11px] font-semibold text-toss-gray-500 uppercase tracking-wide mb-2">역할 변경</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ROLE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              disabled={user.role === opt.value || roleChanging === user.id}
                              onClick={() => handleRoleChange(user.id, opt.value)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                user.role === opt.value
                                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                                  : "bg-secondary text-toss-gray-600 hover:bg-secondary/80"
                              } disabled:opacity-50`}
                            >
                              {roleChanging === user.id ? "..." : user.role === opt.value ? `${opt.label} (현재)` : opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {!isMaster && (
                      <p className="text-[11px] text-toss-gray-400">역할 변경은 마스터만 가능합니다</p>
                    )}

                    {/* 제재 */}
                    {!isBanning ? (
                      <button
                        onClick={() => { setBanTarget(user.id); setBanError(""); setBanReason(""); setBanType("WARNING"); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-toss-red/5 text-[12px] font-medium text-toss-red hover:bg-toss-red/10 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M4.5 4.5l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        제재하기
                      </button>
                    ) : (
                      <div className="space-y-3 bg-toss-red/5 rounded-xl p-3 border border-toss-red/10">
                        <p className="text-[12px] font-semibold text-toss-red">제재 부여</p>

                        {isOperator && (
                          <p className="text-[10px] text-amber-600">운영진의 제재는 승인이 필요합니다</p>
                        )}

                        {/* 제재 종류 */}
                        <div className="flex flex-wrap gap-1.5">
                          {BAN_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setBanType(opt.value)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                banType === opt.value
                                  ? "bg-toss-red/20 text-toss-red ring-1 ring-toss-red/30"
                                  : "bg-card text-toss-gray-600"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* 사유 */}
                        <textarea
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder="제재 사유를 입력하세요"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-card border border-border text-[12px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-toss-red/20 resize-none"
                        />

                        {banError && <p className="text-[11px] text-toss-red">{banError}</p>}

                        <div className="flex gap-2">
                          <button
                            onClick={() => { setBanTarget(null); setBanError(""); }}
                            className="flex-1 h-9 rounded-lg bg-card text-[12px] font-semibold text-toss-gray-600"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => handleBanSubmit(user.id)}
                            disabled={banSubmitting || !banReason.trim()}
                            className="flex-1 h-9 rounded-lg bg-toss-red text-white text-[12px] font-semibold disabled:opacity-40"
                          >
                            {banSubmitting ? "처리 중..." : isOperator ? "승인 요청" : "제재 적용"}
                          </button>
                        </div>
                      </div>
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
