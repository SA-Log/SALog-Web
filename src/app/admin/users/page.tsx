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
  { value: "VERIFIED_CREATOR", label: "크리에이터" },
  { value: "USER", label: "일반" },
];

// Apple-style 역할 칩 — 각 역할에 고유한 색상
const ROLE_CHIP: Record<string, { label: string; text: string; bg: string; ring: string; dot: string }> = {
  USER: { label: "일반", text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", ring: "ring-slate-200 dark:ring-slate-700", dot: "bg-slate-400" },
  OPERATOR: { label: "운영진", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/15", ring: "ring-blue-200 dark:ring-blue-500/30", dot: "bg-blue-500" },
  VICE_MASTER: { label: "부마스터", text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/15", ring: "ring-purple-200 dark:ring-purple-500/30", dot: "bg-purple-500" },
  VERIFIED_CREATOR: { label: "크리에이터", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15", ring: "ring-emerald-200 dark:ring-emerald-500/30", dot: "bg-emerald-500" },
  MASTER: { label: "마스터", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15", ring: "ring-amber-200 dark:ring-amber-500/30", dot: "bg-amber-500" },
};

const BAN_CHIP: Record<string, { label: string; text: string; bg: string }> = {
  WARNING: { label: "경고", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15" },
  TEMP: { label: "정지", text: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/15" },
  PERMANENT: { label: "영구 정지", text: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/15" },
};

const BAN_OPTIONS = [
  { value: "WARNING", label: "경고", desc: "기능 제한 없음" },
  { value: "TEMP_7", label: "7일", desc: "임시 정지" },
  { value: "TEMP_30", label: "30일", desc: "임시 정지" },
  { value: "TEMP_90", label: "90일", desc: "임시 정지" },
  { value: "PERMANENT", label: "영구", desc: "영구 정지" },
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
  const [roleChanging, setRoleChanging] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<string | null>(null);
  const [banType, setBanType] = useState("WARNING");
  const [banReason, setBanReason] = useState("");
  const [banSubmitting, setBanSubmitting] = useState(false);
  const [banError, setBanError] = useState("");

  const isMaster = myRole === "MASTER";
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
    setRoleChanging(userId + newRole);
    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { alert(data?.error || "역할 변경에 실패했습니다"); return; }
      fetchUsers();
    } catch { alert("서버 연결에 실패했습니다"); }
    finally { setRoleChanging(null); }
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
    } else { type = banType; }

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
      setBanTarget(null); setBanReason(""); setBanType("WARNING");
      fetchUsers();
    } catch { setBanError("서버 연결에 실패했습니다"); }
    finally { setBanSubmitting(false); }
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-foreground tracking-tight">유저 관리</h1>
        <p className="text-[13px] text-toss-gray-500 mt-0.5">역할 변경 및 제재를 관리합니다</p>
      </div>

      {/* Search — Apple SF-style */}
      <div className="relative">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-toss-gray-400">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
          placeholder="닉네임 또는 ID로 검색"
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-toss-gray-50 dark:bg-secondary border-none text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {/* Segmented Control — role filter */}
      <div className="bg-toss-gray-50 dark:bg-secondary rounded-2xl p-1 flex gap-0.5 overflow-x-auto scrollbar-hide">
        {ROLE_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setRoleFilter(f.value)}
            className={`flex-1 min-w-fit px-3 py-2 rounded-xl text-[12px] font-semibold transition-all ${
              roleFilter === f.value
                ? "bg-card text-foreground shadow-sm"
                : "text-toss-gray-500 hover:text-foreground"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-[12px] text-toss-gray-400 tabular-nums">{users.length}명의 유저</p>

      {/* User list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card rounded-2xl border border-border/40 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800" />
                  <div className="h-3 w-32 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px] text-toss-gray-500">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {users.map((user) => {
            const chip = ROLE_CHIP[user.role] ?? ROLE_CHIP.USER;
            const displayName = user.nickname ?? "알 수 없음";
            const activeBan = getActiveBan(user);
            const isExpanded = actionUserId === user.id;
            const isBanning = banTarget === user.id;

            return (
              <div key={user.id} className={`bg-card rounded-2xl border shadow-toss overflow-hidden transition-all ${
                isExpanded ? "border-primary/20 shadow-toss-md" : "border-border/40"
              }`}>
                {/* User row */}
                <div className="p-4 flex items-center gap-3.5">
                  {/* Avatar — 원형 */}
                  <div className="w-11 h-11 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {user.image ? (
                      <img src={user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[15px] font-bold text-toss-gray-500">{displayName.charAt(0)}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/profile/${user.id}`} className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors truncate">
                        {displayName}
                      </Link>
                      {/* 역할 칩 */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${chip.bg} ${chip.text}`}>
                        {chip.label}
                      </span>
                      {/* 인증 뱃지 — 프로필과 동일 */}
                      {user.barracksVerified && (
                        <span className="w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center" title="서든어택 인증됨">
                          <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                      )}
                      {/* 제재 상태 */}
                      {activeBan?.active && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${BAN_CHIP[activeBan.type]?.bg} ${BAN_CHIP[activeBan.type]?.text}`}>
                          {BAN_CHIP[activeBan.type]?.label}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-toss-gray-400 mt-0.5">
                      {formatDate(user.createdAt)} 가입
                    </p>
                  </div>

                  {/* 액션 토글 — chevron */}
                  {user.role !== "MASTER" && (
                    <button
                      onClick={() => { setActionUserId(isExpanded ? null : user.id); setBanTarget(null); setBanError(""); }}
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isExpanded ? "bg-primary/10 text-primary" : "bg-toss-gray-100 dark:bg-toss-gray-800 text-toss-gray-400 hover:text-foreground"
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                        <path d="M4 5.5L7 8.5L10 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* 제재 배너 */}
                {activeBan && !isExpanded && (
                  <div className={`px-4 pb-3 -mt-1`}>
                    <div className={`rounded-xl px-3 py-2 ${activeBan.active ? "bg-red-50 dark:bg-red-500/10" : "bg-amber-50 dark:bg-amber-500/10"}`}>
                      <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400">
                        <span className="font-semibold">{BAN_CHIP[activeBan.type]?.label}</span> · {activeBan.reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* ─── 확장 패널 ─── */}
                {isExpanded && user.role !== "MASTER" && (
                  <div className="border-t border-border/30">
                    {/* 역할 변경 — iOS Settings 체크리스트 */}
                    {isMaster && (
                      <div className="px-4 py-4 border-b border-border/20">
                        <p className="text-[11px] font-semibold text-toss-gray-400 uppercase tracking-wider mb-2">역할 변경</p>
                        <div className="bg-toss-gray-50 dark:bg-toss-gray-800/50 rounded-xl overflow-hidden divide-y divide-border/30">
                          {(Object.entries(ROLE_CHIP) as [string, typeof ROLE_CHIP[string]][])
                            .filter(([key]) => key !== "MASTER")
                            .map(([value, style]) => {
                              const isCurrent = user.role === value;
                              const isThisChanging = roleChanging === user.id + value;
                              return (
                                <button
                                  key={value}
                                  disabled={isCurrent || !!roleChanging}
                                  onClick={() => handleRoleChange(user.id, value)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-toss-gray-100/50 dark:hover:bg-toss-gray-700/50 disabled:hover:bg-transparent"
                                >
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isCurrent ? style.dot ?? style.text.replace("text-", "bg-").split(" ")[0] : "bg-transparent"}`} />
                                  <span className={`flex-1 text-[13px] font-medium ${isCurrent ? style.text : "text-toss-gray-600 dark:text-toss-gray-400"}`}>
                                    {style.label}
                                  </span>
                                  {isThisChanging && (
                                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                  )}
                                  {isCurrent && !isThisChanging && (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-primary">
                                      <path d="M4 8.5l3 3 5.5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                    {!isMaster && (
                      <div className="px-4 py-3 border-b border-border/20">
                        <p className="text-[11px] text-toss-gray-400 flex items-center gap-1.5">
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="2" y="5" width="7" height="4.5" rx="1" stroke="currentColor" strokeWidth="1"/><path d="M3.5 5V3.75a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                          역할 변경은 마스터만 가능합니다
                        </p>
                      </div>
                    )}

                    {/* 제재 */}
                    <div className="px-4 py-4">
                      {!isBanning ? (
                        <button
                          onClick={() => { setBanTarget(user.id); setBanError(""); setBanReason(""); setBanType("WARNING"); }}
                          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-[13px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/15 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M4.5 4.5l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                          제재하기
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-[13px] font-bold text-foreground">제재 부여</p>

                          {isOperator && (
                            <div className="rounded-xl px-3 py-2 bg-amber-50 dark:bg-amber-500/10">
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">운영진의 제재는 마스터 또는 부마스터의 승인이 필요합니다</p>
                            </div>
                          )}

                          {/* 제재 종류 — 세그먼트 */}
                          <div className="bg-toss-gray-50 dark:bg-toss-gray-800/50 rounded-xl p-1 flex gap-0.5">
                            {BAN_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setBanType(opt.value)}
                                className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                                  banType === opt.value
                                    ? opt.value === "PERMANENT" || opt.value.startsWith("TEMP")
                                      ? "bg-red-500 text-white shadow-sm"
                                      : "bg-card text-foreground shadow-sm"
                                    : "text-toss-gray-500"
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
                            className="w-full px-4 py-3 rounded-xl bg-toss-gray-50 dark:bg-secondary border-none text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/30 resize-none"
                          />

                          {banError && <p className="text-[12px] text-red-500 text-center">{banError}</p>}

                          <div className="flex gap-2.5">
                            <button
                              onClick={() => { setBanTarget(null); setBanError(""); }}
                              className="flex-1 h-10 rounded-xl bg-toss-gray-50 dark:bg-secondary text-[13px] font-semibold text-toss-gray-600 transition-all hover:bg-toss-gray-100 dark:hover:bg-toss-gray-700"
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleBanSubmit(user.id)}
                              disabled={banSubmitting || !banReason.trim()}
                              className="flex-1 h-10 rounded-xl bg-red-500 text-white text-[13px] font-semibold disabled:opacity-40 transition-all hover:bg-red-600 active:scale-[0.98]"
                            >
                              {banSubmitting ? "처리 중..." : isOperator ? "승인 요청" : "제재 적용"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
