"use client";

import { useState } from "react";
import Link from "next/link";
import { mockApplications, mockMyProfile, formatRelativeTime, type ApplicationStatus } from "@/lib/mock-data";
import { useAdminRole } from "../layout";

const STATUS_FILTERS: { value: ApplicationStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "심사 대기" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "거절" },
];

const STATUS_MAP: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: "심사 대기", color: "text-toss-orange", bg: "bg-toss-orange/10" },
  APPROVED: { label: "승인", color: "text-toss-green", bg: "bg-toss-green/10" },
  REJECTED: { label: "거절", color: "text-toss-red", bg: "bg-toss-red/10" },
};

export default function AdminApplicationsPage() {
  const [filter, setFilter] = useState<ApplicationStatus | "ALL">("ALL");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const { role } = useAdminRole();
  const isMaster = role === "MASTER";

  if (!isMaster) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-toss-red/10 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" stroke="#f04452" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <p className="text-[16px] font-bold text-foreground">마스터만 접근할 수 있습니다</p>
        <p className="text-[13px] text-toss-gray-500 mt-1">크리에이터 심사는 마스터 권한이 필요합니다</p>
      </div>
    );
  }

  const filtered = mockApplications
    .filter((a) => filter === "ALL" || a.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <h1 className="text-[22px] font-bold text-foreground mb-6">크리에이터 심사</h1>

      {/* Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {STATUS_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium btn-chip ${
              filter === f.value ? "bg-primary text-white" : "bg-secondary text-toss-gray-600"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-toss-gray-500 mb-3">총 {filtered.length}건</p>

      <div className="space-y-3">
        {filtered.map((app) => {
          const statusInfo = STATUS_MAP[app.status];

          return (
            <div key={app.id} className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-[11px] text-toss-gray-400">{formatRelativeTime(app.createdAt)}</span>
                  </div>
                  <p className="text-[16px] font-semibold text-foreground">{app.userName}</p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="text-toss-gray-500 shrink-0">채널</span>
                  <a href={app.channelUrl} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline truncate">{app.channelUrl}</a>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="text-toss-gray-500 shrink-0">유형</span>
                  <span className="text-foreground">{app.channelType}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="text-toss-gray-500 shrink-0">팔로워</span>
                  <span className="text-foreground font-medium">{app.followerCount}</span>
                </div>
                {app.barracksAddress && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-toss-gray-500 shrink-0">병영주소</span>
                    <a href={app.barracksAddress} target="_blank" rel="noopener noreferrer"
                      className="text-primary hover:underline truncate font-mono text-[12px]">{app.barracksAddress}</a>
                  </div>
                )}
              </div>

              {/* Verification Video */}
              <div className="mb-4">
                <p className="text-[12px] font-semibold text-toss-gray-600 mb-1.5 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-amber-500">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  인증 영상
                </p>
                <a href={app.verificationVideoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 hover:bg-amber-500/10 transition-toss">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-amber-500 shrink-0">
                    <path d="M6.5 4.5l5 3.5-5 3.5V4.5z" fill="currentColor"/>
                    <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  <span className="text-[12px] text-primary hover:underline truncate">{app.verificationVideoUrl}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold shrink-0 ml-auto">공개 확인 필요</span>
                </a>
                <p className="text-[11px] text-toss-gray-400 mt-1">
                  영상 제목이 &quot;[SALog] 인증 크리에이터 심사 요청&quot;인지 확인하세요
                </p>
              </div>

              {/* Content Links */}
              <div className="mb-4">
                <p className="text-[12px] font-semibold text-toss-gray-600 mb-1.5">콘텐츠 링크</p>
                <div className="flex flex-wrap gap-1.5">
                  {app.contentLinks.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-secondary text-[12px] text-primary hover:bg-primary/10 transition-toss truncate max-w-[200px]">
                      {link}
                    </a>
                  ))}
                </div>
              </div>

              {/* Introduction */}
              <div className="bg-secondary/50 rounded-xl p-3 mb-4">
                <p className="text-[12px] font-semibold text-toss-gray-600 mb-1">자기소개</p>
                <p className="text-[13px] text-foreground">{app.introduction}</p>
              </div>

              {/* Review result (if reviewed) */}
              {app.status !== "PENDING" && app.reviewReason && (
                <div className={`rounded-xl p-3 mb-3 ${app.status === "APPROVED" ? "bg-toss-green/5" : "bg-toss-red/5"}`}>
                  <p className="text-[12px] font-semibold text-toss-gray-600 mb-1">심사 사유</p>
                  <p className="text-[13px] text-foreground">{app.reviewReason}</p>
                  {app.reviewedAt && (
                    <p className="text-[11px] text-toss-gray-400 mt-1">{formatRelativeTime(app.reviewedAt)} 심사 완료</p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {app.status === "PENDING" && (
                <>
                  {reviewingId === app.id ? (
                    <div className="bg-secondary rounded-xl p-4">
                      <p className="text-[12px] font-semibold text-foreground mb-2">심사 결정</p>
                      <textarea placeholder="심사 사유를 입력하세요 (필수)" rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-[12px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-3" />
                      <div className="flex gap-2">
                        <button onClick={() => setReviewingId(null)}
                          className="flex-1 h-9 rounded-lg bg-card border border-border text-[12px] font-semibold text-toss-gray-600 btn-secondary">
                          취소
                        </button>
                        <button className="flex-1 h-9 rounded-lg bg-toss-red/10 text-toss-red text-[12px] font-semibold btn-chip">
                          거절
                        </button>
                        <button className="flex-1 h-9 rounded-lg bg-toss-green text-white text-[12px] font-semibold btn-primary">
                          승인
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setReviewingId(app.id)}
                      className="h-8 px-4 rounded-lg bg-primary/10 text-primary text-[12px] font-medium flex items-center btn-chip">
                      심사하기
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[14px] text-toss-gray-400">해당하는 신청이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
