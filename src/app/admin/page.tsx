"use client";

import { useState } from "react";
import Link from "next/link";
import { mockHackReports, mockMannerTags, mockUsers, mockApplications, mockAdminLogs, mockPendingApprovals, formatRelativeTime, ROLE_MAP, HACK_STATUS_MAP, type PendingApproval } from "@/lib/mock-data";
import { useAdminRole } from "./layout";

export default function AdminDashboard() {
  const { role } = useAdminRole();
  const [approvalActions, setApprovalActions] = useState<Record<string, "approved" | "rejected">>({});
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  const isMaster = role === "MASTER";
  const isViceMaster = role === "VICE_MASTER";
  const canApprove = isMaster || isViceMaster;
  const canSeeApplications = isMaster;
  const canSeeUsers = isMaster || isViceMaster || role === "OPERATOR";

  const pendingReports = mockHackReports.filter((r) => r.status === "SUSPECT" || r.status === "PROBABLE");
  const confirmedReports = mockHackReports.filter((r) => r.status === "CONFIRMED");
  const pendingApps = mockApplications.filter((a) => a.status === "PENDING");
  const recentLogs = mockAdminLogs.slice(0, 5);

  const pendingApprovals = mockPendingApprovals.filter((a) => a.status === "PENDING");

  const urgentReports = mockHackReports.filter(
    (r) => r.status === "SUSPECT" && r.agreeCount > 10 && r.agreeCount / (r.agreeCount + r.disagreeCount) > 0.7
  );

  const statsCards = [
    { value: pendingReports.length, label: "검증 대기 신고", color: "text-toss-orange", href: "/admin/reports" },
    { value: confirmedReports.length, label: "핵 확정 유저", color: "text-toss-red", href: "/admin/reports" },
    ...(canSeeUsers ? [{ value: mockUsers.length, label: "전체 유저", color: "text-foreground", href: "/admin/users" }] : []),
    ...(canSeeApplications ? [{ value: pendingApps.length, label: "심사 대기", color: "text-toss-green", href: "/admin/applications" }] : []),
  ];

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-6">관리자 대시보드</h1>

      {/* Stats */}
      <div className={`grid ${statsCards.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"} gap-3 mb-6`}>
        {statsCards.map((s) => (
          <Link key={s.label} href={s.href} className="bg-card rounded-2xl border border-border/50 shadow-toss p-4 hover:shadow-toss-md transition-toss">
            <p className={`text-[24px] font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-toss-gray-500 mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* 승인 대기 — 마스터/부마스터만 표시 */}
      {canApprove && pendingApprovals.length > 0 && (
        <div className="bg-card rounded-2xl border border-amber-500/20 shadow-toss p-5 mb-6">
          <h2 className="text-[14px] font-semibold text-foreground mb-1 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-amber-500">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M8 5v3.5M8 10.5h.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            운영진 승인 요청
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold">{pendingApprovals.length}</span>
          </h2>
          <p className="text-[11px] text-toss-gray-400 mb-4">운영진이 요청한 작업입니다. 승인하면 즉시 적용됩니다.</p>

          <div className="space-y-3">
            {pendingApprovals.map((approval) => {
              const action = approvalActions[approval.id];
              const requesterRoleInfo = ROLE_MAP[approval.requesterRole];

              return (
                <div key={approval.id} className={`rounded-xl border p-4 transition-all duration-300 ${
                  action === "approved"
                    ? "bg-toss-green/5 border-toss-green/20"
                    : action === "rejected"
                      ? "bg-toss-red/5 border-toss-red/20"
                      : "bg-secondary/30 border-border/50"
                }`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          approval.type === "report_status" ? "bg-toss-red/10 text-toss-red" : "bg-toss-orange/10 text-toss-orange"
                        }`}>
                          {approval.type === "report_status" ? "신고 상태 변경" : "유저 제재"}
                        </span>
                        <span className="text-[11px] text-toss-gray-400">{formatRelativeTime(approval.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px]">
                        <span className="font-semibold text-foreground">{approval.requesterName}</span>
                        <span className={`text-[10px] font-semibold ${requesterRoleInfo.color}`}>{requesterRoleInfo.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  {approval.type === "report_status" && (
                    <div className="bg-card rounded-lg p-3 mb-3 border border-border/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-foreground">{approval.reportNickname}</span>
                        <span className="text-[11px] text-toss-gray-400">→</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          approval.requestedStatus === "CONFIRMED"
                            ? "bg-toss-red/10 text-toss-red"
                            : approval.requestedStatus === "PROBABLE"
                              ? "bg-amber-400/10 text-amber-500"
                              : "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          {HACK_STATUS_MAP[approval.requestedStatus!]?.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400">{approval.reason}</p>
                      <Link href={`/reports/${approval.reportId}`} className="text-[11px] text-primary hover:underline mt-1 inline-block">
                        신고 상세보기
                      </Link>
                    </div>
                  )}

                  {approval.type === "user_sanction" && (
                    <div className="bg-card rounded-lg p-3 mb-3 border border-border/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-foreground">{approval.targetUserName}</span>
                        <span className="text-[11px] text-toss-gray-400">→</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          approval.sanctionType === "warn" ? "bg-toss-orange/10 text-toss-orange" : "bg-toss-red/10 text-toss-red"
                        }`}>
                          {approval.sanctionLabel}
                        </span>
                      </div>
                      <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400">{approval.reason}</p>
                    </div>
                  )}

                  {/* Action */}
                  {action ? (
                    <div className={`flex items-center gap-2 h-9 justify-center text-[12px] font-semibold ${
                      action === "approved" ? "text-toss-green" : "text-toss-red"
                    }`}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        {action === "approved"
                          ? <path d="M3.5 7.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          : <><path d="M4 4l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 4l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>
                        }
                      </svg>
                      {action === "approved" ? "승인 완료 — 적용되었습니다" : "반려 완료"}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={reviewComments[approval.id] ?? ""}
                        onChange={(e) => setReviewComments((prev) => ({ ...prev, [approval.id]: e.target.value }))}
                        placeholder="코멘트 (선택)"
                        rows={1}
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-[12px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setApprovalActions((prev) => ({ ...prev, [approval.id]: "rejected" }))}
                          className="flex-1 h-9 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800 border border-border text-toss-red text-[12px] font-semibold btn-chip">
                          반려
                        </button>
                        <button
                          onClick={() => setApprovalActions((prev) => ({ ...prev, [approval.id]: "approved" }))}
                          className="flex-1 h-9 rounded-lg bg-toss-green text-white text-[12px] font-semibold btn-primary">
                          승인
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Urgent + Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Urgent */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
          <h2 className="text-[14px] font-semibold text-foreground mb-3 flex items-center gap-2">
            긴급 처리 필요
            {urgentReports.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-toss-red text-white text-[10px] font-bold">{urgentReports.length}</span>
            )}
          </h2>
          {urgentReports.length > 0 ? (
            <div className="space-y-2">
              {urgentReports.map((r) => (
                <Link key={r.id} href={`/reports/${r.id}`} className="flex items-center justify-between p-3 rounded-xl bg-toss-red/5 hover:bg-toss-red/10 transition-toss">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{r.nickname}</p>
                    <p className="text-[11px] text-toss-gray-500">찬성 {r.agreeCount} / 반대 {r.disagreeCount}</p>
                  </div>
                  <span className="text-[11px] text-toss-red font-semibold">검토 필요</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-toss-gray-400 text-center py-6">긴급 처리 건이 없습니다</p>
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
          <h2 className="text-[14px] font-semibold text-foreground mb-3">요약</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400">전체 핵 신고</span>
              <span className="text-[13px] font-semibold text-foreground">{mockHackReports.length}건</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400">전체 비매너 신고</span>
              <span className="text-[13px] font-semibold text-foreground">{mockMannerTags.length}건</span>
            </div>
            {canSeeUsers && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400">인증 크리에이터</span>
                  <span className="text-[13px] font-semibold text-foreground">{mockUsers.filter((u) => u.role === "VERIFIED_CREATOR").length}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400">운영진</span>
                  <span className="text-[13px] font-semibold text-foreground">{mockUsers.filter((u) => u.role === "OPERATOR" || u.role === "VICE_MASTER").length}명</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent logs */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-foreground">최근 관리 활동</h2>
          <Link href="/admin/logs" className="text-[12px] text-primary hover:underline">전체보기</Link>
        </div>
        <div className="space-y-3">
          {recentLogs.map((log) => {
            const roleInfo = ROLE_MAP[log.actorRole];
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">{log.actorName.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[12px] font-semibold text-foreground">{log.actorName}</span>
                    <span className={`text-[10px] font-semibold ${roleInfo.color}`}>{roleInfo.label}</span>
                  </div>
                  <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400 mt-0.5">
                    <span className="font-medium text-foreground">{log.targetName}</span> - {log.action}
                  </p>
                  <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatRelativeTime(log.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
