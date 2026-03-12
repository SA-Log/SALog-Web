"use client";

import { useState } from "react";
import Link from "next/link";
import { RankBadge, TitleBadge } from "@/components/common/title-badge";
import { mockUsers, mockMyProfile, mockPendingApprovals, ROLE_MAP, type UserRole, formatRelativeTime } from "@/lib/mock-data";
import { useAdminRole } from "../layout";

const ROLE_FILTERS: { value: UserRole | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "MASTER", label: "마스터" },
  { value: "VICE_MASTER", label: "부마스터" },
  { value: "OPERATOR", label: "운영진" },
  { value: "VERIFIED_CREATOR", label: "인증 크리에이터" },
  { value: "USER", label: "일반" },
];

export default function AdminUsersPage() {
  const { role: myRole } = useAdminRole();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});
  const [selectedSuspend, setSelectedSuspend] = useState<Record<string, string>>({});
  const [sanctionReasons, setSanctionReasons] = useState<Record<string, string>>({});
  // 운영진 승인 요청 상태
  const [sanctionApprovalRequested, setSanctionApprovalRequested] = useState<Record<string, boolean>>({});

  const isMaster = myRole === "MASTER";
  const isOperator = myRole === "OPERATOR";
  const canDirectSanction = myRole === "MASTER" || myRole === "VICE_MASTER";

  const getSelectedRole = (userId: string, currentRole: UserRole) => selectedRoles[userId] ?? currentRole;
  const getSelectedSuspend = (userId: string) => selectedSuspend[userId] ?? "";
  const getSanctionReason = (userId: string) => sanctionReasons[userId] ?? "";

  // 해당 유저에 대해 이미 제재 승인 대기 중인 요청이 있는지
  const getPendingSanction = (userId: string) => {
    return mockPendingApprovals.find(
      (a) => a.type === "user_sanction" && a.targetUserId === userId && a.status === "PENDING"
    );
  };

  const filtered = mockUsers
    .filter((u) => roleFilter === "ALL" || u.role === roleFilter)
    .filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search))
    .sort((a, b) => ROLE_MAP[b.role].order - ROLE_MAP[a.role].order);

  const SANCTION_OPTIONS = [
    { value: "warn", label: "경고", color: "text-toss-orange" },
    { value: "1d", label: "1일 정지", color: "text-toss-red" },
    { value: "3d", label: "3일 정지", color: "text-toss-red" },
    { value: "7d", label: "7일 정지", color: "text-toss-red" },
    { value: "30d", label: "30일 정지", color: "text-toss-red" },
    { value: "permanent", label: "영구 정지", color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-2">유저 관리</h1>
      {isOperator && (
        <p className="text-[12px] text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 4v2.5M6 8h.005" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/></svg>
          운영진은 제재 요청만 가능합니다. 부마스터 이상의 승인 후 적용됩니다.
        </p>
      )}
      {myRole === "VICE_MASTER" && (
        <p className="text-[12px] text-toss-gray-400 mb-4 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 4v2.5M6 8h.005" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/></svg>
          부마스터는 제재만 가능합니다. 역할 변경은 마스터만 할 수 있습니다.
        </p>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-toss-gray-400">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="닉네임 또는 ID로 검색"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {/* Role filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {ROLE_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setRoleFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium btn-chip ${
              roleFilter === f.value ? "bg-primary text-white" : "bg-secondary text-toss-gray-600"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-toss-gray-500 mb-3">총 {filtered.length}명</p>

      <div className="space-y-2">
        {filtered.map((user) => {
          const roleInfo = ROLE_MAP[user.role];
          const isMe = user.id === mockMyProfile.id;
          const pendingSanction = getPendingSanction(user.id);
          const localRequested = sanctionApprovalRequested[user.id];

          return (
            <div key={user.id} className="bg-card rounded-2xl border border-border/50 shadow-toss p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-bold text-toss-gray-500">{user.name.charAt(0)}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link href={`/profile/${user.id}`} className="text-[14px] font-semibold text-foreground hover:text-primary transition-toss truncate">
                      {user.name}
                    </Link>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${roleInfo.bg} ${roleInfo.color}`}>{roleInfo.label}</span>
                    <RankBadge rank={user.rank} />
                    <TitleBadge title={user.title} />
                    {isMe && <span className="text-[10px] text-toss-gray-400">(나)</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-toss-gray-500">
                    <span>명중률 {user.accuracy}%</span>
                    <span>신고 {user.totalReports}</span>
                    <span>{formatRelativeTime(user.joinedAt)} 가입</span>
                  </div>
                </div>

                {/* Actions */}
                {!isMe && (
                  <div className="shrink-0">
                    <button onClick={() => setActionUserId(actionUserId === user.id ? null : user.id)}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center btn-ghost">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="3" r="1" fill="currentColor" className="text-toss-gray-500"/>
                        <circle cx="7" cy="7" r="1" fill="currentColor" className="text-toss-gray-500"/>
                        <circle cx="7" cy="11" r="1" fill="currentColor" className="text-toss-gray-500"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* 기존 제재 승인 대기 표시 */}
              {pendingSanction && !localRequested && (
                <div className="mt-3 rounded-xl p-3 bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold">제재 승인 대기</span>
                    <span className="text-[11px] text-toss-gray-400">{formatRelativeTime(pendingSanction.createdAt)}</span>
                  </div>
                  <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400">
                    {pendingSanction.sanctionLabel} 요청 — {pendingSanction.reason}
                  </p>
                </div>
              )}

              {/* Action panel */}
              {actionUserId === user.id && (
                <div className="mt-3 pt-3 border-t border-border/50 space-y-4">
                  {/* Role changes — 마스터만 가능 */}
                  {isMaster && user.role !== "MASTER" && (
                    <div>
                      <p className="text-[11px] font-semibold text-toss-gray-500 uppercase tracking-wide mb-2">역할 변경</p>
                      <div className="bg-secondary/50 rounded-xl p-3 space-y-1">
                        {([
                          { value: "VICE_MASTER" as UserRole, label: "부마스터", color: "text-purple-400" },
                          { value: "OPERATOR" as UserRole, label: "운영진", color: "text-blue-400" },
                          { value: "VERIFIED_CREATOR" as UserRole, label: "인증 크리에이터", color: "text-toss-green" },
                          { value: "USER" as UserRole, label: "일반 유저", color: "text-toss-gray-500" },
                        ]).map((opt) => {
                          const selected = getSelectedRole(user.id, user.role) === opt.value;
                          return (
                            <label key={opt.value}
                              onClick={() => setSelectedRoles((prev) => ({ ...prev, [user.id]: opt.value }))}
                              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-toss ${
                                selected ? "bg-card shadow-sm" : "hover:bg-card/50"
                              }`}>
                              <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                                selected ? "border-primary" : "border-toss-gray-300 dark:border-toss-gray-600"
                              }`}>
                                {selected && <div className="w-[10px] h-[10px] rounded-full bg-primary" />}
                              </div>
                              <span className={`text-[13px] font-medium ${selected ? opt.color : "text-toss-gray-600 dark:text-toss-gray-400"}`}>
                                {opt.label}
                              </span>
                              {user.role === opt.value && (
                                <span className="text-[10px] text-toss-gray-400 ml-auto">현재</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                      {getSelectedRole(user.id, user.role) !== user.role && (
                        <button className="mt-2 w-full h-9 rounded-lg bg-primary text-white text-[12px] font-semibold btn-primary">
                          역할 변경 적용
                        </button>
                      )}
                    </div>
                  )}

                  {/* 운영진/부마스터: 역할 변경 불가 안내 */}
                  {!isMaster && user.role !== "MASTER" && (
                    <div className="bg-secondary/50 rounded-xl p-3">
                      <p className="text-[12px] text-toss-gray-400 flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v0a5 5 0 015 5v1.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 011 7.5V6a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.2"/><path d="M4.5 9v1.5a1.5 1.5 0 003 0V9" stroke="currentColor" strokeWidth="1.2"/></svg>
                        역할 변경은 마스터만 가능합니다
                      </p>
                    </div>
                  )}

                  {/* 제재 */}
                  <div>
                    <p className="text-[11px] font-semibold text-toss-gray-500 uppercase tracking-wide mb-2">
                      제재 {isOperator && <span className="text-amber-500 normal-case">(승인 필요)</span>}
                    </p>
                    <div className="bg-secondary/50 rounded-xl p-3 space-y-1">
                      {SANCTION_OPTIONS.map((opt) => {
                        const selected = getSelectedSuspend(user.id) === opt.value;
                        return (
                          <label key={opt.value}
                            onClick={() => setSelectedSuspend((prev) => ({ ...prev, [user.id]: selected ? "" : opt.value }))}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-toss ${
                              selected ? "bg-card shadow-sm" : "hover:bg-card/50"
                            }`}>
                            <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selected
                                ? opt.value === "permanent" ? "border-red-600 dark:border-red-400" : opt.value === "warn" ? "border-toss-orange" : "border-toss-red"
                                : "border-toss-gray-300 dark:border-toss-gray-600"
                            }`}>
                              {selected && (
                                <div className={`w-[10px] h-[10px] rounded-full ${
                                  opt.value === "permanent" ? "bg-red-600 dark:bg-red-400" : opt.value === "warn" ? "bg-toss-orange" : "bg-toss-red"
                                }`} />
                              )}
                            </div>
                            <span className={`text-[13px] ${selected ? `font-semibold ${opt.color}` : "font-medium text-toss-gray-600 dark:text-toss-gray-400"}`}>
                              {opt.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {/* 제재 사유 + 버튼 */}
                    {getSelectedSuspend(user.id) && (
                      <div className="mt-2 space-y-2">
                        {/* 운영진은 사유 필수 */}
                        {isOperator && (
                          <textarea
                            value={getSanctionReason(user.id)}
                            onChange={(e) => setSanctionReasons((prev) => ({ ...prev, [user.id]: e.target.value }))}
                            placeholder="제재 사유를 입력하세요 (필수)"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-[12px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                        )}

                        {localRequested ? (
                          <div className="flex items-center gap-2 h-9 justify-center text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                              <path d="M7 4.5v3M7 9h.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            승인 요청 완료 — 부마스터 이상의 승인을 대기 중
                          </div>
                        ) : isOperator ? (
                          <button
                            disabled={!getSanctionReason(user.id).trim()}
                            onClick={() => setSanctionApprovalRequested((prev) => ({ ...prev, [user.id]: true }))}
                            className={`w-full h-9 rounded-lg text-[12px] font-semibold transition-all duration-200 ${
                              getSanctionReason(user.id).trim()
                                ? "bg-amber-500 text-white btn-primary"
                                : "bg-toss-gray-200 dark:bg-toss-gray-700 text-toss-gray-400 cursor-not-allowed"
                            }`}>
                            <span className="flex items-center justify-center gap-1.5">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                                <path d="M6 3.5v3M6 8h.005" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                              </svg>
                              {getSelectedSuspend(user.id) === "warn" ? "경고" : "정지"} 승인 요청
                            </span>
                          </button>
                        ) : (
                          <button className={`w-full h-9 rounded-lg text-white text-[12px] font-semibold btn-primary ${
                            getSelectedSuspend(user.id) === "warn" ? "bg-toss-orange" : "bg-toss-red"
                          }`}>
                            {getSelectedSuspend(user.id) === "warn" ? "경고 적용" : "정지 적용"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
