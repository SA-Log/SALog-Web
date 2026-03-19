"use client";

import { useState, useEffect } from "react";
import { ROLE_MAP, formatRelativeTime } from "@/lib/mock-data";

type LogFilter = "ALL" | "hackReport" | "mannerTag" | "user" | "ban";

const LOG_FILTERS: { value: LogFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "hackReport", label: "핵 신고" },
  { value: "mannerTag", label: "비매너" },
  { value: "user", label: "유저" },
  { value: "ban", label: "밴" },
];

type LogItem = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detail: string | null;
  createdAt: string;
  actor: { id: string; nickname: string | null; role: string };
};

export default function AdminLogsPage() {
  const [filter, setFilter] = useState<LogFilter>("ALL");
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/logs")
      .then(r => r.json())
      .then(d => setLogs(d.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(log => filter === "ALL" || log.targetType === filter);

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-6">관리 로그</h1>

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

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => {
            const roleInfo = ROLE_MAP[log.actor.role as keyof typeof ROLE_MAP] ?? ROLE_MAP.USER;
            return (
              <div key={log.id} className="bg-card rounded-2xl border border-border/50 shadow-toss p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">{(log.actor.nickname ?? "?").charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-[13px] font-semibold text-foreground">{log.actor.nickname ?? "관리자"}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${roleInfo.bg} ${roleInfo.color}`}>{roleInfo.label}</span>
                    </div>
                    <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400">
                      {log.action}
                      {log.detail && <span className="font-medium text-foreground ml-1">{log.detail}</span>}
                    </p>
                    <p className="text-[11px] text-toss-gray-400 mt-1.5">{formatRelativeTime(log.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[14px] text-toss-gray-400">관리 로그가 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
