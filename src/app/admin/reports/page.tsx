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

  async function updateStatus(id: string, status: string, type: "hack" | "manner", adminNote?: string) {
    setUpdating(id);
    const path = type === "hack" ? `/api/admin/reports/${id}/status` : `/api/admin/manner/${id}/status`;
    const body: Record<string, string> = { status };
    if (adminNote) body.adminNote = adminNote;
    try {
      const res = await fetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) fetchReports();
      else alert("상태 변경에 실패했습니다");
    } catch { alert("요청 실패"); }
    finally { setUpdating(null); }
  }

  const filters = tab === "hack" ? HACK_STATUS_FILTERS : MANNER_STATUS_FILTERS;

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-6">신고 관리</h1>

      {/* Tab */}
      <div className="flex gap-1 mb-4 bg-secondary rounded-xl p-1">
        <button onClick={() => { setTab("hack"); setStatusFilter("ALL"); setPage(1); }}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium ${tab === "hack" ? "bg-card text-foreground shadow-toss" : "text-toss-gray-500"}`}>
          핵 신고
        </button>
        <button onClick={() => { setTab("manner"); setStatusFilter("ALL"); setPage(1); }}
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
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <p className="text-[13px] text-toss-gray-400 text-center py-12">해당 조건의 신고가 없습니다</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-card rounded-2xl border border-border/50 shadow-toss p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={tab === "hack" ? `/reports/${r.id}` : `/manner/${r.id}`} className="text-[14px] font-bold text-foreground hover:text-primary truncate">
                      {r.nickname}
                    </Link>
                    {tab === "hack" ? (
                      <StatusBadge status={r.status} />
                    ) : (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.status === "CONFIRMED" ? "bg-toss-red/10 text-toss-red" : r.status === "REJECTED" ? "bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-500" : "bg-amber-100 dark:bg-amber-500/20 text-amber-600"}`}>
                        {r.status === "CONFIRMED" ? "확정" : r.status === "REJECTED" ? "반려" : "검토 중"}
                      </span>
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
                  {/* 태그 */}
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {tab === "hack" && r.hackTypes?.map((t: string) => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-600 dark:text-toss-gray-300">{t}</span>
                    ))}
                    {tab === "manner" && r.tagTypes?.map((t: string) => {
                      const info = MANNER_TAG_MAP[t as keyof typeof MANNER_TAG_MAP];
                      return <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] ${info?.bg ?? "bg-gray-100"} ${info?.color ?? "text-gray-600"}`}>{info?.label ?? t}</span>;
                    })}
                  </div>
                </div>

                {/* 상태 변경 버튼 */}
                {canDirectConfirm && (
                  <div className="flex flex-col gap-1 shrink-0">
                    {tab === "hack" && r.status !== "CONFIRMED" && (
                      <button onClick={() => updateStatus(r.id, "CONFIRMED", "hack")} disabled={updating === r.id}
                        className="px-3 py-1.5 rounded-lg bg-toss-red text-white text-[11px] font-semibold hover:bg-toss-red/90 disabled:opacity-50">
                        확정
                      </button>
                    )}
                    {tab === "hack" && r.status !== "DISMISSED" && (
                      <button onClick={() => updateStatus(r.id, "DISMISSED", "hack")} disabled={updating === r.id}
                        className="px-3 py-1.5 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800 text-toss-gray-600 text-[11px] font-semibold hover:bg-toss-gray-200 disabled:opacity-50">
                        기각
                      </button>
                    )}
                    {tab === "manner" && r.status === "PENDING" && (
                      <>
                        <button onClick={() => updateStatus(r.id, "CONFIRMED", "manner")} disabled={updating === r.id}
                          className="px-3 py-1.5 rounded-lg bg-toss-red text-white text-[11px] font-semibold hover:bg-toss-red/90 disabled:opacity-50">
                          확정
                        </button>
                        <button onClick={() => { const note = prompt("반려 사유를 입력하세요"); if (note) updateStatus(r.id, "REJECTED", "manner", note); }} disabled={updating === r.id}
                          className="px-3 py-1.5 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800 text-toss-gray-600 text-[11px] font-semibold hover:bg-toss-gray-200 disabled:opacity-50">
                          반려
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
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
