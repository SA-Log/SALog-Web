"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/hack/status-badge";
import { mockHackReports, mockMannerTags, mockPendingApprovals, HACK_STATUS_MAP, MANNER_TAG_MAP, formatRelativeTime, type HackStatus, type PendingApproval } from "@/lib/mock-data";
import { useAdminRole } from "../layout";

type ReportTab = "hack" | "manner";

const STATUS_FILTERS: { value: HackStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "SUSPECT", label: "핵 의심" },
  { value: "PROBABLE", label: "핵 유력" },
  { value: "CONFIRMED", label: "핵 확정" },
  { value: "DISMISSED", label: "기각" },
];

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>("hack");
  const [statusFilter, setStatusFilter] = useState<HackStatus | "ALL">("ALL");
  type ActiveStatus = "CONFIRMED" | "PROBABLE" | "DISMISSED" | null;
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ActiveStatus>>({});
  const [reasonsByStatus, setReasonsByStatus] = useState<Record<string, Record<string, string>>>({});
  const [applied, setApplied] = useState<Record<string, { status: ActiveStatus; reason: string }>>({});
  // 운영진 승인 요청 상태
  const [approvalRequested, setApprovalRequested] = useState<Record<string, { status: ActiveStatus; reason: string }>>({});

  const { role: userRole } = useAdminRole();
  const canDirectConfirm = userRole === "MASTER" || userRole === "VICE_MASTER";
  const isOperator = userRole === "OPERATOR";

  const getActiveStatus = (id: string, originalStatus: HackStatus): ActiveStatus => {
    if (id in statusOverrides) return statusOverrides[id];
    if (originalStatus === "CONFIRMED" || originalStatus === "PROBABLE" || originalStatus === "DISMISSED") return originalStatus;
    return null;
  };

  const getReason = (id: string, status: ActiveStatus) => {
    if (!status) return "";
    const byStatus = reasonsByStatus[id];
    if (byStatus && status in byStatus) return byStatus[status];
    if (applied[id]) return "";
    const report = mockHackReports.find((r) => r.id === id);
    if (report?.adminVerdict?.status === status) return report.adminVerdict.reason;
    return "";
  };

  const setReason = (id: string, status: ActiveStatus, value: string) => {
    if (!status) return;
    setReasonsByStatus((prev) => ({
      ...prev,
      [id]: { ...prev[id], [status]: value },
    }));
  };

  const toggleStatus = (id: string, target: ActiveStatus, originalStatus: HackStatus) => {
    const current = getActiveStatus(id, originalStatus);
    setStatusOverrides((prev) => ({
      ...prev,
      [id]: current === target ? null : target,
    }));
  };

  const handleApply = (id: string, status: ActiveStatus, reason: string) => {
    setApplied((prev) => ({ ...prev, [id]: { status, reason } }));
    setReasonsByStatus((prev) => {
      const current = prev[id];
      if (!current || !status) return prev;
      const cleaned: Record<string, string> = { [status]: reason };
      return { ...prev, [id]: cleaned };
    });
  };

  const handleApprovalRequest = (id: string, status: ActiveStatus, reason: string) => {
    setApprovalRequested((prev) => ({ ...prev, [id]: { status, reason } }));
  };

  const isApplyEnabled = (id: string, active: ActiveStatus, reason: string) => {
    if (!reason.trim()) return false;
    const prev = applied[id];
    if (prev) return prev.status !== active || prev.reason !== reason;
    const report = mockHackReports.find((r) => r.id === id);
    if (report?.adminVerdict && report.adminVerdict.status === active && report.adminVerdict.reason === reason) {
      return false;
    }
    return true;
  };

  // 해당 신고에 대해 이미 승인 대기 중인 요청이 있는지
  const getPendingApproval = (reportId: string): PendingApproval | undefined => {
    return mockPendingApprovals.find(
      (a) => a.type === "report_status" && a.reportId === reportId && a.status === "PENDING"
    );
  };

  const filteredHack = mockHackReports
    .filter((r) => statusFilter === "ALL" || r.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-6">신고 관리</h1>

      {/* Tab */}
      <div className="flex gap-1 mb-5 bg-secondary rounded-xl p-1">
        <button onClick={() => setTab("hack")}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium btn-chip ${tab === "hack" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"}`}>
          핵 신고 <span className={`ml-1 text-[11px] ${tab === "hack" ? "text-toss-red" : "text-toss-gray-400"}`}>{mockHackReports.length}</span>
        </button>
        <button onClick={() => setTab("manner")}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium btn-chip ${tab === "manner" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"}`}>
          비매너 신고 <span className={`ml-1 text-[11px] ${tab === "manner" ? "text-toss-orange" : "text-toss-gray-400"}`}>{mockMannerTags.length}</span>
        </button>
      </div>

      {tab === "hack" && (
        <>
          {/* Status filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
            {STATUS_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium btn-chip ${
                  statusFilter === f.value ? "bg-primary text-white" : "bg-secondary text-toss-gray-600"
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          <p className="text-[13px] text-toss-gray-500 mb-3">총 {filteredHack.length}건</p>

          <div className="space-y-3">
            {filteredHack.map((report) => {
              const voteTotal = report.agreeCount + report.disagreeCount;
              const agreePercent = voteTotal > 0 ? Math.round((report.agreeCount / voteTotal) * 100) : 0;
              const existingPending = getPendingApproval(report.id);
              const localApprovalReq = approvalRequested[report.id];

              return (
                <div key={report.id} className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={report.status} />
                        <span className="text-[11px] text-toss-gray-400">{formatRelativeTime(report.createdAt)}</span>
                      </div>
                      <Link href={`/reports/${report.id}`} className="text-[16px] font-semibold text-foreground hover:text-primary transition-toss">
                        {report.nickname}
                      </Link>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[16px] font-bold ${agreePercent >= 70 ? "text-toss-red" : "text-toss-gray-500"}`}>{agreePercent}%</p>
                      <p className="text-[11px] text-toss-gray-400">찬성 {report.agreeCount} / 반대 {report.disagreeCount}</p>
                    </div>
                  </div>

                  <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400 line-clamp-2 mb-3">{report.description}</p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[12px] text-toss-gray-500">
                      신고자: <span className="font-medium text-foreground">{report.reporterName}</span> (명중률 {report.reporterAccuracy}%)
                    </div>
                    <Link href={`/reports/${report.id}`} className="shrink-0 h-7 px-3 rounded-lg bg-secondary text-[11px] font-medium text-toss-gray-600 dark:text-toss-gray-400 flex items-center hover:bg-toss-gray-200 dark:hover:bg-toss-gray-700 transition-toss">
                      상세보기
                    </Link>
                  </div>

                  {/* 기존 승인 대기 표시 (운영진 view) */}
                  {isOperator && existingPending && !localApprovalReq && (
                    <div className="rounded-xl p-3 bg-amber-500/5 border border-amber-500/20 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold">승인 대기</span>
                        <span className="text-[11px] text-toss-gray-400">{formatRelativeTime(existingPending.createdAt)}</span>
                      </div>
                      <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400">
                        {HACK_STATUS_MAP[existingPending.requestedStatus!]?.label} 요청 — {existingPending.reason}
                      </p>
                    </div>
                  )}

                  {/* Admin actions — toggles */}
                  {(() => {
                    const active = getActiveStatus(report.id, report.status);

                    // 운영진: CONFIRMED는 승인 요청으로, PROBABLE/DISMISSED는 직접
                    const needsApproval = isOperator && active === "CONFIRMED";

                    const toggleItems: { key: ActiveStatus; label: string; onColor: string; onBg: string; textOn: string; borderOn: string; icon: React.ReactNode; desc: string; btnColor: string; restricted?: boolean; approvalRequired?: boolean }[] = [
                      {
                        key: "CONFIRMED", label: "핵 확정",
                        onColor: "bg-toss-red", onBg: "bg-toss-red/5", textOn: "text-toss-red", borderOn: "border-toss-red/20",
                        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M3 11l8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
                        desc: isOperator ? "핵 확정 처리 (부마스터 이상 승인 필요)" : "핵 확정 처리됩니다",
                        btnColor: "bg-toss-red",
                        approvalRequired: isOperator,
                      },
                      {
                        key: "PROBABLE", label: "핵 유력",
                        onColor: "bg-amber-400", onBg: "bg-amber-400/5", textOn: "text-amber-500", borderOn: "border-amber-400/20",
                        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3v5M7 10v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
                        desc: "핵 유력 처리됩니다", btnColor: "bg-amber-400",
                      },
                      {
                        key: "DISMISSED", label: "기각",
                        onColor: "bg-emerald-500", onBg: "bg-emerald-500/5", textOn: "text-emerald-500", borderOn: "border-emerald-500/20",
                        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                        desc: "기각 처리됩니다", btnColor: "bg-emerald-500",
                      },
                    ];

                    const activeItem = toggleItems.find((t) => t.key === active);

                    return (
                      <div className={`rounded-xl p-4 transition-all duration-300 border ${
                        activeItem ? `${activeItem.onBg} ${activeItem.borderOn}` : "bg-secondary/50 border-transparent"
                      }`}>
                        {/* 3 toggles */}
                        <div className="flex items-center gap-3">
                          {toggleItems.map((item, idx) => {
                            const isOn = active === item.key;

                            return (
                              <div key={item.key} className="flex items-center gap-3 flex-1">
                                {idx > 0 && <div className="w-px h-8 bg-border/40 shrink-0" />}
                                <button
                                  onClick={() => toggleStatus(report.id, item.key, report.status)}
                                  className="flex items-center gap-2 flex-1"
                                >
                                  <div className={`relative w-10 h-[22px] rounded-full transition-all duration-300 shrink-0 ${
                                    isOn ? item.onColor : "bg-toss-gray-300 dark:bg-toss-gray-600"
                                  }`}>
                                    <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                                      isOn ? "left-[21px]" : "left-[3px]"
                                    }`} />
                                  </div>
                                  <div>
                                    <p className={`text-[12px] font-semibold transition-colors duration-300 leading-tight ${
                                      isOn ? item.textOn : "text-toss-gray-500"
                                    }`}>{item.label}</p>
                                    {item.approvalRequired && (
                                      <p className="text-[9px] text-amber-500 leading-tight">승인 필요</p>
                                    )}
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* 상태 변경 안내 — 토글 ON 시 */}
                        {activeItem && (() => {
                          const reason = getReason(report.id, active);
                          const enabled = isApplyEnabled(report.id, active, reason);
                          const wasAppliedManually = applied[report.id] && applied[report.id].status === active && applied[report.id].reason === reason;
                          const wasAppliedOriginal = !applied[report.id] && report.adminVerdict && report.adminVerdict.status === active && report.adminVerdict.reason === reason;
                          const wasApplied = wasAppliedManually || wasAppliedOriginal;
                          const wasApprovalRequested = localApprovalReq && localApprovalReq.status === active;

                          return (
                            <div className={`mt-3 pt-3 border-t transition-all duration-300 ${activeItem.borderOn}`}>
                              <div className={`flex items-center gap-2 mb-2 text-[12px] font-semibold ${activeItem.textOn}`}>
                                {activeItem.icon}
                                {activeItem.desc}
                              </div>
                              <textarea
                                value={reason}
                                onChange={(e) => setReason(report.id, active, e.target.value)}
                                placeholder={needsApproval ? "승인 요청 사유를 입력하세요 (필수)" : "사유를 입력하세요 (필수)"} rows={2}
                                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-[12px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-2" />

                              {/* 승인 요청 완료 */}
                              {wasApprovalRequested ? (
                                <div className="flex items-center gap-2 h-9 justify-center text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                                    <path d="M7 4.5v3M7 9h.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                  </svg>
                                  승인 요청 완료 — 부마스터 이상의 승인을 대기 중
                                </div>
                              ) : wasApplied ? (
                                <div className="flex items-center gap-2 h-9 justify-center text-[12px] font-semibold text-toss-green">
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  적용 완료
                                </div>
                              ) : needsApproval ? (
                                /* 운영진: CONFIRMED는 승인 요청 버튼 */
                                <button
                                  disabled={!enabled}
                                  onClick={() => handleApprovalRequest(report.id, active, reason)}
                                  className={`w-full h-9 rounded-lg text-[12px] font-semibold transition-all duration-200 ${
                                    enabled
                                      ? "bg-amber-500 text-white btn-primary"
                                      : "bg-toss-gray-200 dark:bg-toss-gray-700 text-toss-gray-400 cursor-not-allowed"
                                  }`}>
                                  <span className="flex items-center justify-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                                      <path d="M6 3.5v3M6 8h.005" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                    </svg>
                                    핵 확정 승인 요청
                                  </span>
                                </button>
                              ) : (
                                /* 마스터/부마스터: 직접 적용 */
                                <button
                                  disabled={!enabled}
                                  onClick={() => handleApply(report.id, active, reason)}
                                  className={`w-full h-9 rounded-lg text-[12px] font-semibold transition-all duration-200 ${
                                    enabled
                                      ? `text-white btn-primary ${activeItem.btnColor}`
                                      : "bg-toss-gray-200 dark:bg-toss-gray-700 text-toss-gray-400 cursor-not-allowed"
                                  }`}>
                                  {activeItem.label} 적용
                                </button>
                              )}
                            </div>
                          );
                        })()}

                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "manner" && (
        <div className="space-y-3">
          <p className="text-[13px] text-toss-gray-500 mb-3">총 {mockMannerTags.length}건</p>
          {mockMannerTags.map((tag) => {
            const info = MANNER_TAG_MAP[tag.tagType];
            const voteTotal = tag.agreeCount + tag.disagreeCount;
            const agreePercent = voteTotal > 0 ? Math.round((tag.agreeCount / voteTotal) * 100) : 0;

            return (
              <div key={tag.id} className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-semibold ${info.bg} ${info.color}`}>
                        {info.emoji} {info.label}
                      </span>
                      <span className="text-[11px] text-toss-gray-400">{formatRelativeTime(tag.createdAt)}</span>
                    </div>
                    <Link href={`/manner/${tag.id}`} className="text-[16px] font-semibold text-foreground hover:text-primary transition-toss">
                      {tag.nickname}
                    </Link>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[16px] font-bold ${agreePercent >= 70 ? "text-toss-orange" : "text-toss-gray-500"}`}>{agreePercent}%</p>
                    <p className="text-[11px] text-toss-gray-400">동의 {tag.agreeCount} / 반대 {tag.disagreeCount}</p>
                  </div>
                </div>

                <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400 line-clamp-2 mb-3">{tag.description}</p>

                <div className="flex items-center justify-between">
                  <div className="text-[12px] text-toss-gray-500">
                    신고자: <span className="font-medium text-foreground">{tag.reporterName}</span>
                  </div>
                  <Link href={`/manner/${tag.id}`} className="shrink-0 h-7 px-3 rounded-lg bg-secondary text-[11px] font-medium text-toss-gray-600 dark:text-toss-gray-400 flex items-center hover:bg-toss-gray-200 dark:hover:bg-toss-gray-700 transition-toss">
                    상세보기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
