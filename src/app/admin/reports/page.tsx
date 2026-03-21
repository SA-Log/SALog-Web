"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/hack/status-badge";
import { MANNER_TAG_MAP, formatRelativeTime, type HackStatus } from "@/lib/mock-data";
import { useAdminRole } from "../layout";

type ReportTab = "hack" | "manner";

const HACK_STATUS_FILTERS: { value: HackStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "SUSPECT", label: "의심" },
  { value: "PROBABLE", label: "유력" },
  { value: "CONFIRMED", label: "확정" },
  { value: "DISMISSED", label: "기각" },
];

const MANNER_STATUS_FILTERS = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "검토 중" },
  { value: "CONFIRMED", label: "확정" },
  { value: "REJECTED", label: "반려" },
];

const HACK_ACTIONS = [
  { value: "SUSPECT", label: "의심", color: "text-amber-500", ring: "ring-amber-500" },
  { value: "PROBABLE", label: "유력", color: "text-orange-500", ring: "ring-orange-500" },
  { value: "CONFIRMED", label: "확정", color: "text-toss-red", ring: "ring-toss-red" },
  { value: "DISMISSED", label: "기각", color: "text-toss-gray-500", ring: "ring-toss-gray-400" },
];

const MANNER_ACTIONS = [
  { value: "PENDING", label: "검토 중", color: "text-amber-500", ring: "ring-amber-500" },
  { value: "CONFIRMED", label: "확정", color: "text-toss-red", ring: "ring-toss-red" },
  { value: "REJECTED", label: "반려", color: "text-toss-gray-500", ring: "ring-toss-gray-400" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportItem = Record<string, any>;

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>("hack");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // 판정 패널 상태
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState("");
  const [actionNote, setActionNote] = useState("");

  const { role: userRole } = useAdminRole();
  const canDirectConfirm = userRole === "MASTER" || userRole === "VICE_MASTER";

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: tab, page: String(page) });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      setReports(data.reports ?? []);
      setTotal(data.total ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [tab, statusFilter, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function submitAction(id: string, status: string, type: "hack" | "manner", note: string) {
    if (!note.trim()) { alert("판정 사유를 입력해주세요"); return; }
    setUpdating(id);
    const path = type === "hack" ? `/api/admin/reports/${id}/status` : `/api/admin/manner/${id}/status`;
    try {
      const res = await fetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, adminNote: note.trim() }) });
      const data = await res.json().catch(() => null);
      if (res.ok) { fetchReports(); setExpandedId(null); setSelectedAction(""); setActionNote(""); }
      else alert(data?.error ?? "상태 변경에 실패했습니다");
    } catch { alert("요청 실패"); }
    finally { setUpdating(null); }
  }

  const filters = tab === "hack" ? HACK_STATUS_FILTERS : MANNER_STATUS_FILTERS;
  const actions = tab === "hack" ? HACK_ACTIONS : MANNER_ACTIONS;

  function getEvidenceCount(r: ReportItem): number {
    const original = (r.evidences && Array.isArray(r.evidences)) ? r.evidences.length : 0;
    const additional = r._count?.additionalEvidence ?? 0;
    return original + additional;
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-6">신고 관리</h1>

      {/* Tab */}
      <div className="flex gap-1 mb-4 bg-secondary rounded-xl p-1">
        <button onClick={() => { setTab("hack"); setStatusFilter("ALL"); setPage(1); setExpandedId(null); }}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium ${tab === "hack" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"}`}>
          핵 신고
        </button>
        <button onClick={() => { setTab("manner"); setStatusFilter("ALL"); setPage(1); setExpandedId(null); }}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium ${tab === "manner" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"}`}>
          비매너 신고
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 overflow-x-auto mb-4 pb-1">
        {filters.map(f => (
          <button key={f.value} onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium ${statusFilter === f.value ? "bg-primary text-white" : "bg-secondary text-toss-gray-600"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-[12px] text-toss-gray-400 mb-3">총 {total}건</p>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <p className="text-[13px] text-toss-gray-400 text-center py-12">해당 조건의 신고가 없습니다</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const evidenceCount = getEvidenceCount(r);
            const isExpanded = expandedId === r.id;
            const detailPath = tab === "hack" ? `/reports/${r.id}` : `/manner/${r.id}`;

            return (
              <div key={r.id} className="bg-card rounded-2xl border border-border/50 shadow-toss overflow-hidden">
                {/* 헤더 */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={detailPath} className="text-[14px] font-bold text-foreground hover:text-primary truncate">
                          {r.nickname}
                        </Link>
                        {tab === "hack" ? (
                          <StatusBadge status={r.status} />
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.status === "CONFIRMED" ? "bg-toss-red/10 text-toss-red" : r.status === "REJECTED" ? "bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-500" : "bg-amber-100 dark:bg-amber-500/20 text-amber-600"}`}>
                            {r.status === "CONFIRMED" ? "확정" : r.status === "REJECTED" ? "반려" : "검토 중"}
                          </span>
                        )}
                        {evidenceCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-toss-green/10 text-toss-green">증거 {evidenceCount}</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-400">증거 없음</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-toss-gray-400">
                        <span>{r.reporter?.nickname ?? "유저"}</span>
                        <span>{formatRelativeTime(r.createdAt)}</span>
                        {tab === "hack" && r.agreeCount !== undefined && (
                          <span>찬성 {r.agreeCount} / 반대 {r.disagreeCount}</span>
                        )}
                      </div>
                      {r.description && <p className="text-[12px] text-toss-gray-500 mt-1 line-clamp-1">{r.description}</p>}
                      {r.adminNote && (
                        <p className="text-[11px] text-toss-gray-400 mt-1 bg-secondary/50 rounded px-2 py-1">판정: {r.adminNote}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Link href={detailPath} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 text-center">
                        상세보기
                      </Link>
                      {canDirectConfirm && (
                        <button
                          onClick={() => { setExpandedId(isExpanded ? null : r.id); setSelectedAction(r.status); setActionNote(""); }}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold text-center ${isExpanded ? "bg-primary text-white" : "border border-border text-toss-gray-500 hover:border-primary hover:text-primary"}`}>
                          {isExpanded ? "닫기" : "판정"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 판정 패널 */}
                {isExpanded && canDirectConfirm && (
                  <div className="border-t border-border/50 bg-secondary/30 p-4">
                    {/* 라디오 버튼 */}
                    <p className="text-[11px] font-semibold text-toss-gray-500 mb-2">상태 변경</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {actions.map(a => (
                        <button key={a.value}
                          onClick={() => setSelectedAction(a.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                            selectedAction === a.value
                              ? `${a.ring} ring-2 border-transparent ${a.color} bg-card shadow-sm`
                              : "border-border text-toss-gray-500 hover:border-toss-gray-400"
                          }`}>
                          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                            selectedAction === a.value ? a.ring.replace("ring-", "border-") : "border-toss-gray-300"
                          }`}>
                            {selectedAction === a.value && <div className={`w-1.5 h-1.5 rounded-full ${a.color.replace("text-", "bg-")}`} />}
                          </div>
                          {a.label}
                        </button>
                      ))}
                    </div>

                    {/* 사유 입력 */}
                    {selectedAction !== r.status && (
                      <>
                        <textarea
                          value={actionNote}
                          onChange={e => setActionNote(e.target.value)}
                          placeholder="판정 사유를 입력하세요 (공개됨)"
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-3"
                        />
                        <button
                          onClick={() => submitAction(r.id, selectedAction, tab, actionNote)}
                          disabled={!actionNote.trim() || updating === r.id}
                          className={`w-full h-9 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 ${
                            selectedAction === "CONFIRMED" ? "bg-toss-red" : selectedAction === "PROBABLE" ? "bg-orange-500" : selectedAction === "SUSPECT" || selectedAction === "PENDING" ? "bg-amber-500" : "bg-toss-gray-500"
                          }`}>
                          {updating === r.id ? "처리 중..." : "적용"}
                        </button>
                      </>
                    )}
                    {selectedAction === r.status && (
                      <p className="text-[12px] text-toss-gray-400 text-center py-2">현재 상태와 동일합니다. 다른 상태를 선택하세요.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg bg-secondary text-[12px] font-medium disabled:opacity-30">이전</button>
          <span className="text-[12px] text-toss-gray-400 py-1.5">{page} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
            className="px-3 py-1.5 rounded-lg bg-secondary text-[12px] font-medium disabled:opacity-30">다음</button>
        </div>
      )}
    </div>
  );
}
