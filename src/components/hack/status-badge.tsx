"use client";

import { HACK_STATUS_MAP, type HackStatus } from "@/lib/mock-data";

export function StatusBadge({ status }: { status: HackStatus }) {
  const info = HACK_STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${info.bg} ${info.color}`}>
      {info.label}
    </span>
  );
}
