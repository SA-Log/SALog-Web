"use client";

import { useState } from "react";
import { mockAdminLogs, ROLE_MAP, formatRelativeTime } from "@/lib/mock-data";

type LogFilter = "ALL" | "report" | "manner" | "user" | "application";

const LOG_FILTERS: { value: LogFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "report", label: "신고" },
  { value: "user", label: "유저" },
  { value: "application", label: "심사" },
  { value: "manner", label: "비매너" },
];

const TARGET_ICON: Record<string, string> = {
  report: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  application: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  manner: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
};

export default function AdminLogsPage() {
  const [filter, setFilter] = useState<LogFilter>("ALL");

  const filtered = mockAdminLogs
    .filter((log) => filter === "ALL" || log.targetType === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-6">관리 로그</h1>

      {/* Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {LOG_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium btn-chip ${
              filter === f.value ? "bg-primary text-white" : "bg-secondary text-toss-gray-600"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-toss-gray-500 mb-3">총 {filtered.length}건</p>

      <div className="space-y-2">
        {filtered.map((log) => {
          const roleInfo = ROLE_MAP[log.actorRole];
          const icon = TARGET_ICON[log.targetType] || TARGET_ICON.user;

          return (
            <div key={log.id} className="bg-card rounded-2xl border border-border/50 shadow-toss p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
                    <path d={icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[13px] font-semibold text-foreground">{log.actorName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${roleInfo.bg} ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>

                  <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400">
                    <span className="font-medium text-foreground">{log.targetName}</span>
                    <span className="mx-1">—</span>
                    {log.action}
                  </p>

                  {log.reason && (
                    <p className="text-[12px] text-toss-gray-500 mt-1 bg-secondary/50 rounded-lg px-2.5 py-1.5">
                      사유: {log.reason}
                    </p>
                  )}

                  <p className="text-[11px] text-toss-gray-400 mt-1.5">{formatRelativeTime(log.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[14px] text-toss-gray-400">해당하는 로그가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
