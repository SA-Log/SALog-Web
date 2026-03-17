"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { StatusBadge } from "@/components/hack/status-badge";
import { LoginPrompt } from "@/components/common/login-prompt";
import { MANNER_TAG_MAP } from "@/lib/mock-data";

interface Evidence {
  type: string;
  url: string;
  name: string;
}

export interface ReportDetailData {
  id: string;
  nickname: string;
  barracksAddress: string;
  description: string | null;
  evidences: Evidence[] | null;
  youtubeUrl?: string | null;
  createdAt: string;
  reporter: { id: string; nickname: string | null; image: string | null; barracksVerified?: boolean };
  reporterId: string;
  // 핵 유저 전용
  status?: string;
  hackTypes?: string[];
  agreeCount?: number;
  unsureCount?: number;
  disagreeCount?: number;
  userVote?: "AGREE" | "UNSURE" | "DISAGREE" | null;
  nicknameHistory?: { id: string; oldNickname: string; newNickname: string; detectedAt: string }[];
  comments?: { id: string; content: string; createdAt: string; user: { id: string; nickname: string | null; image: string | null; barracksVerified?: boolean } }[];
  // 비매너 전용
  tagType?: string;
  tagTypes?: string[];
  blacklisted?: boolean;
}

type VoteType = "AGREE" | "UNSURE" | "DISAGREE";

const HACK_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  aimbot: { label: "에임핵", icon: "🎯" },
  wallhack: { label: "월핵", icon: "👁" },
  speedhack: { label: "스피드핵", icon: "⚡" },
  norecoil: { label: "무반동", icon: "🔫" },
  other: { label: "기타", icon: "🔧" },
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function EvidenceGallery({ items, links }: { items: Evidence[]; links: Evidence[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const goTo = useCallback((index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, items.length - 1)));
  }, [items.length]);
  const touchStartX = useRef<number | null>(null);

  const typeLabel = (type: string) => type === "screenshot" ? "스크린샷" : type === "video" ? "영상" : "YouTube";
  const thumbSrc = (ev: Evidence): string | null => {
    if (ev.type === "screenshot") return ev.url;
    if (ev.type === "youtube") { const vid = extractYoutubeId(ev.url); return vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : null; }
    return null;
  };

  const current = items[activeIndex];

  return (
    <div>
      {current && (
        <div className="relative"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { if (touchStartX.current === null) return; const dx = e.changedTouches[0].clientX - touchStartX.current; touchStartX.current = null; if (Math.abs(dx) > 50) goTo(dx < 0 ? activeIndex + 1 : activeIndex - 1); }}
        >
          <div className="relative aspect-[16/10] bg-toss-gray-100 dark:bg-toss-gray-900 select-none">
            {current.type === "screenshot" ? (
              <a href={current.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <img src={current.url} alt={current.name} className="w-full h-full object-cover" draggable={false} />
              </a>
            ) : (() => {
              const vid = extractYoutubeId(current.url);
              return (
                <a href={current.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group">
                  {vid && <img src={`https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`} alt="" className="w-full h-full object-cover bg-black" draggable={false} />}
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5V19L19 12L8 5Z"/></svg>
                    </div>
                  </div>
                </a>
              );
            })()}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-[11px] text-white/90 font-medium pointer-events-none">{typeLabel(current.type)}</div>
            {items.length > 1 && <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-[11px] text-white/80 font-medium tabular-nums pointer-events-none">{activeIndex + 1}/{items.length}</div>}
          </div>
          {items.length > 1 && (
            <>
              {activeIndex > 0 && <button onClick={() => goTo(activeIndex - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
              {activeIndex < items.length - 1 && <button onClick={() => goTo(activeIndex + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
            </>
          )}
        </div>
      )}
      {items.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto px-5 py-1" style={{ scrollbarWidth: "none" }}>
          {items.map((ev, i) => {
            const src = thumbSrc(ev);
            return (
              <button key={i} onClick={() => goTo(i)} className={`shrink-0 w-[52px] h-[52px] rounded-[10px] overflow-hidden border-2 transition-all ${i === activeIndex ? "border-primary scale-105 shadow-toss" : "border-transparent opacity-50 hover:opacity-80"}`}>
                {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-toss-gray-200 dark:bg-toss-gray-700 flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="#6b7684" strokeWidth="1.2" strokeLinecap="round"/></svg></div>}
              </button>
            );
          })}
        </div>
      )}
      {links.length > 0 && (
        <div className={`space-y-1 px-5 ${items.length > 0 ? "mt-3" : ""}`}>
          {links.map((ev, i) => (
            <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-toss-gray-50 dark:hover:bg-toss-gray-800 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center shrink-0 group-hover:bg-primary/10"><svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-toss-gray-400 group-hover:text-primary"/></svg></div>
              <div className="min-w-0 flex-1"><span className="text-[13px] text-foreground group-hover:text-primary truncate block">{ev.name}</span><span className="text-[11px] text-toss-gray-400 truncate block">{ev.url}</span></div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportDetailView({ report: initialReport, type }: { report: ReportDetailData; type: "hack" | "manner" }) {
  const [report, setReport] = useState(initialReport);
  const { user: authUser, isLoggedIn } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  function requireLogin(): boolean {
    if (!isLoggedIn) { setShowLoginPrompt(true); return true; }
    return false;
  }
  const isAuthor = report.reporterId === authUser?.id;
  const [userVote, setUserVote] = useState<VoteType | null>(report.userVote ?? null);
  const [hasVoted, setHasVoted] = useState(!!report.userVote);
  const [agreeOffset, setAgreeOffset] = useState(0);
  const [unsureOffset, setUnsureOffset] = useState(0);
  const [disagreeOffset, setDisagreeOffset] = useState(0);
  const [commentText, setCommentText] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [blacklisted, setBlacklisted] = useState(!!initialReport.blacklisted);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [relatedReports, setRelatedReports] = useState<{ hackReports: { id: string; nickname: string; status: string; createdAt: string }[]; mannerReports: { id: string; nickname: string; createdAt: string }[] } | null>(null);

  // 동일 병영주소의 다른 신고 내역
  useEffect(() => {
    if (!report.barracksAddress) return;
    fetch(`/api/search?q=${report.barracksAddress}&type=barracks`)
      .then(r => r.json())
      .then(d => setRelatedReports({
        hackReports: (d.hackReports ?? []).filter((r: { id: string }) => r.id !== report.id),
        mannerReports: (d.mannerReports ?? []).filter((r: { id: string }) => r.id !== report.id),
      }))
      .catch(() => {});
  }, [report.barracksAddress, report.id]);
  const [editDescription, setEditDescription] = useState(report.description ?? "");
  const [editHackTypes, setEditHackTypes] = useState<string[]>(report.hackTypes ?? []);
  const [editTagTypes, setEditTagTypes] = useState<string[]>(report.tagTypes ?? (report.tagType ? [report.tagType] : []));
  const [editEvidences, setEditEvidences] = useState<Evidence[]>((report.evidences ?? []) as Evidence[]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const listPath = type === "hack" ? "/reports" : "/manner";
  const apiPath = type === "hack" ? `/api/reports/${report.id}` : `/api/manner/${report.id}`;
  const accentColor = type === "hack" ? "toss-red" : "toss-orange";

  async function handleComment() {
    if (requireLogin()) return;
    if (!commentText.trim()) return;
    const commentApi = type === "hack" ? `/api/reports/${report.id}/comment` : `/api/manner/${report.id}/comment`;
    try {
      const res = await fetch(commentApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setReport((prev) => ({ ...prev, comments: [...(prev.comments ?? []), data] }));
        setCommentText("");
      }
    } catch { /* ignore */ }
  }

  async function handleBlacklist() {
    if (requireLogin()) return;
    if (!report.barracksAddress) return;
    setBlacklistLoading(true);
    try {
      if (blacklisted) {
        const res = await fetch("/api/blacklist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barracksAddress: report.barracksAddress }),
        });
        if (res.ok) setBlacklisted(false);
      } else {
        const res = await fetch("/api/blacklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barracksAddress: report.barracksAddress, nickname: report.nickname }),
        });
        if (res.ok || res.status === 409) setBlacklisted(true);
      }
    } catch { /* ignore */ }
    finally { setBlacklistLoading(false); }
  }

  function openEdit() {
    setEditDescription(report.description ?? "");
    setEditHackTypes(report.hackTypes ?? []);
    setEditTagTypes(report.tagTypes ?? (report.tagType ? [report.tagType] : []));
    setEditEvidences((report.evidences ?? []) as Evidence[]);
    setIsEditing(true);
  }

  function moveEvidence(from: number, to: number) {
    const arr = [...editEvidences];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setEditEvidences(arr);
  }

  async function handleSaveEdit() {
    setIsSavingEdit(true);
    try {
      const body: Record<string, unknown> = { description: editDescription.trim(), evidences: editEvidences };
      if (type === "hack") body.hackTypes = editHackTypes;
      if (type === "manner") body.tagTypes = editTagTypes;

      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        // state 직접 업데이트
        setReport((prev) => ({
          ...prev,
          description: editDescription.trim() || null,
          evidences: editEvidences,
          ...(type === "hack" ? { hackTypes: editHackTypes } : {}),
          ...(type === "manner" ? { tagTypes: editTagTypes, tagType: editTagTypes[0] } : {}),
        }));
        setIsEditing(false);
      } else {
        alert("수정에 실패했습니다");
      }
    } catch { alert("서버 연결에 실패했습니다"); }
    finally { setIsSavingEdit(false); }
  }

  function handleVote(vt: VoteType) {
    if (requireLogin()) return;
    if (hasVoted || isAuthor) return;
    setUserVote(vt);
    setHasVoted(true);
    if (vt === "AGREE") setAgreeOffset(1);
    else if (vt === "UNSURE") setUnsureOffset(1);
    else setDisagreeOffset(1);
  }

  const currentAgree = (report.agreeCount ?? 0) + agreeOffset;
  const currentUnsure = (report.unsureCount ?? 0) + unsureOffset;
  const currentDisagree = (report.disagreeCount ?? 0) + disagreeOffset;
  const voteTotal = currentAgree + currentUnsure + currentDisagree;
  const agreePercent = voteTotal > 0 ? Math.round((currentAgree / voteTotal) * 100) : 0;
  const unsurePercent = voteTotal > 0 ? Math.round((currentUnsure / voteTotal) * 100) : 0;
  const disagreePercent = voteTotal > 0 ? 100 - agreePercent - unsurePercent : 0;

  const evidences = (report.evidences ?? []) as Evidence[];
  const hasLegacyYt = report.youtubeUrl && !evidences.some((e) => e.type === "youtube");
  const allEvidences: Evidence[] = [...evidences, ...(hasLegacyYt ? [{ type: "youtube", url: report.youtubeUrl!, name: "YouTube" }] : [])];
  // 유저가 설정한 순서 유지 (정렬 없음)
  const visualEvidences = allEvidences.filter((e) => ["screenshot", "video", "youtube"].includes(e.type));
  const linkEvidences = allEvidences.filter((e) => e.type === "link");
  const sortedEvidences = allEvidences;

  const displayTypes = report.tagTypes?.length ? report.tagTypes : report.tagType ? [report.tagType] : [];
  const barracksUrl = report.barracksAddress ? `https://barracks.sa.nexon.com/${report.barracksAddress}/match` : null;
  const comments = report.comments ?? [];
  const nicknameHistory = report.nicknameHistory ?? [];

  // 핵/비매너 구분 라벨
  const voteLabels = type === "hack"
    ? [
        { label: "핵 맞음", key: "AGREE" as VoteType, count: currentAgree, percent: agreePercent, color: "bg-toss-red", textColor: "text-toss-red" },
        { label: "잘 모르겠음", key: "UNSURE" as VoteType, count: currentUnsure, percent: unsurePercent, color: "bg-amber-400", textColor: "text-amber-500" },
        { label: "핵 아님", key: "DISAGREE" as VoteType, count: currentDisagree, percent: disagreePercent, color: "bg-toss-blue", textColor: "text-toss-blue" },
      ]
    : [
        { label: "동의", key: "AGREE" as VoteType, count: currentAgree, percent: agreePercent, color: "bg-toss-green", textColor: "text-toss-green" },
        { label: "반대", key: "DISAGREE" as VoteType, count: currentDisagree, percent: disagreePercent, color: "bg-toss-red", textColor: "text-toss-red" },
      ];

  return (
    <div className="mx-auto max-w-screen-lg px-5 py-6 pb-12">
      {/* Nav + Author actions */}
      <div className="flex items-center justify-between mb-5">
        <Link href={listPath} className="inline-flex items-center gap-1 text-[13px] text-toss-gray-500 hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          목록으로
        </Link>
        {isAuthor && (
          <div className="flex items-center gap-2">
            <button onClick={openEdit} className="h-8 px-3 rounded-lg text-[12px] font-medium text-toss-gray-500 hover:text-foreground hover:bg-secondary transition-colors">편집</button>
            <button
              onClick={async () => {
                if (!confirm("이 게시글을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
                const res = await fetch(apiPath, { method: "DELETE" });
                if (res.ok) window.location.href = listPath;
                else alert("삭제에 실패했습니다");
              }}
              className="h-8 px-3 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >삭제</button>
          </div>
        )}
      </div>

      {/* ─── Reported User ─── */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-toss p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-5 h-5 rounded-md bg-${accentColor}/10 flex items-center justify-center`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 6C7.1 6 8 5.1 8 4S7.1 2 6 2 4 2.9 4 4 4.9 6 6 6ZM6 7C4.67 7 2 7.67 2 9V10H10V9C10 7.67 7.33 7 6 7Z" fill={type === "hack" ? "#f04452" : "#f59f00"}/></svg>
          </div>
          <span className={`text-[12px] font-semibold text-${accentColor}`}>신고 대상</span>
          {report.status && <div className="ml-auto"><StatusBadge status={report.status} /></div>}
        </div>
        <div>
          <h1 className="text-[20px] sm:text-[24px] font-bold text-foreground tracking-tight truncate">{report.nickname}</h1>
          <div className="min-w-0">

            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {type === "hack" && report.hackTypes?.map((ht) => {
                const info = HACK_TYPE_LABELS[ht];
                return (
                  <span key={ht} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-600 dark:text-toss-gray-300 text-[11px] font-medium leading-none">
                    <span className="text-[10px] leading-none">{info?.icon}</span><span className="leading-none">{info?.label || ht}</span>
                  </span>
                );
              })}
              {type === "manner" && displayTypes.map((t) => {
                const info = MANNER_TAG_MAP[t as keyof typeof MANNER_TAG_MAP] ?? MANNER_TAG_MAP.OTHER;
                return (
                  <span key={t} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium leading-none ${info.bg} ${info.color}`}>
                    <span className="text-[10px] leading-none">{info.emoji}</span><span className="leading-none">{info.label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {barracksUrl && (
            <a href={barracksUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 dark:bg-primary/10 text-[12px] font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              병영수첩 바로가기
            </a>
          )}
          {report.barracksAddress && (
            <button
              onClick={handleBlacklist}
              disabled={blacklistLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all active:scale-[0.97] ${
                blacklisted
                  ? "bg-toss-gray-100 dark:bg-toss-gray-800 text-toss-green"
                  : "bg-toss-red/10 text-toss-red hover:bg-toss-red/20"
              }`}
            >
              {blacklisted ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  블랙리스트에 추가됨
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  블랙리스트에 추가
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ─── Reporter ─── */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-toss p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-toss-blue/10 flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 6C7.1 6 8 5.1 8 4S7.1 2 6 2 4 2.9 4 4 4.9 6 6 6ZM6 7C4.67 7 2 7.67 2 9V10H10V9C10 7.67 7.33 7 6 7Z" fill="#3182f6"/></svg></div>
            <span className="text-[12px] font-semibold text-toss-blue">신고자</span>
          </div>
          <span className="text-[11px] text-toss-gray-400">{formatRelativeTime(report.createdAt)}</span>
        </div>
        <Link href={authUser?.id === report.reporter.id ? "/profile" : `/profile/${report.reporter.id}`} className="flex items-center gap-3 mt-3 p-2.5 -mx-1 rounded-xl hover:bg-secondary transition-colors group">
          <div className="w-10 h-10 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 overflow-hidden flex items-center justify-center ring-2 ring-toss-blue/20 group-hover:ring-toss-blue/40 transition-all shrink-0">
            {report.reporter.image ? <img src={report.reporter.image} alt="" className="w-full h-full object-cover" /> : <span className="text-[14px] font-bold text-toss-gray-500">{(report.reporter.nickname || "?").charAt(0)}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">{report.reporter.nickname || "익명"}</p>
              {report.reporter.barracksVerified && (
                <span className="w-[16px] h-[16px] rounded-full bg-primary flex items-center justify-center shrink-0">
                  <svg width="9" height="9" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              )}
            </div>
            <p className="text-[11px] text-toss-gray-400">프로필 보기</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-toss-gray-300 dark:text-toss-gray-600 shrink-0"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </div>

      {/* ─── Content + Evidence ─── */}
      {(report.description || sortedEvidences.length > 0) && (
        <div className="bg-card rounded-2xl border border-border/40 shadow-toss mb-4">
          {report.description && (
            <div className={`p-5 ${sortedEvidences.length > 0 ? "pb-0" : ""}`}>
              <h2 className="text-[15px] font-semibold text-foreground mb-3">신고 사유</h2>
              <p className="text-[14px] text-toss-gray-700 dark:text-toss-gray-300 leading-[1.7]">{report.description}</p>
            </div>
          )}
          {sortedEvidences.length > 0 && (
            <div className={report.description ? "pt-4 pb-5" : "pb-5"}>
              {report.description && <div className="border-t border-border/40 mb-4 mx-5" />}
              <div className="flex items-center gap-2 mb-3 px-5">
                <h3 className="text-[13px] font-semibold text-toss-gray-600 dark:text-toss-gray-400">증거 자료 <span className="text-toss-gray-400 font-normal ml-1">{sortedEvidences.length}</span></h3>
              </div>
              <EvidenceGallery items={visualEvidences} links={linkEvidences} />
            </div>
          )}
        </div>
      )}

      {/* ─── Vote + Nickname History ─── */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-toss">
          <h2 className="text-[15px] font-semibold text-foreground mb-5">커뮤니티 투표</h2>
          <div className="space-y-3 mb-5">
            {voteLabels.map((v) => (
              <div key={v.label}>
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className={`${v.textColor} font-semibold`}>{v.label}</span>
                  <span className={`${v.textColor} font-bold tabular-nums`}>{v.count}<span className="text-toss-gray-400 font-normal ml-1">({v.percent}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-toss-gray-100 dark:bg-toss-gray-700 overflow-hidden">
                  <div className={`h-full rounded-full ${v.color} transition-all duration-700 ease-out`} style={{ width: `${v.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-toss-gray-400 text-center mb-4">총 {voteTotal}명 참여</p>
          {isAuthor ? (
            <div className="text-center py-3 rounded-xl bg-secondary"><p className="text-[13px] text-toss-gray-500">본인이 작성한 신고에는 투표할 수 없습니다</p></div>
          ) : hasVoted ? (
            <div className="text-center py-3 rounded-xl bg-secondary">
              <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400">
                <span className={`font-semibold ${voteLabels.find(v => v.key === userVote)?.textColor}`}>{voteLabels.find(v => v.key === userVote)?.label}</span>에 투표했습니다
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              {voteLabels.map((v) => (
                <button key={v.key} onClick={() => handleVote(v.key)}
                  className={`flex-1 h-11 rounded-xl text-[13px] font-semibold ${v.color}/10 ${v.textColor} hover:${v.color} hover:text-white transition-all duration-200 active:scale-[0.97]`}
                  style={{ backgroundColor: `var(--tw-${v.color.replace("bg-", "")}-10, rgba(0,0,0,0.05))` }}
                >{v.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Nickname history */}
        <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-toss">
          <h2 className="text-[15px] font-semibold text-foreground mb-4 flex items-center gap-2">
            닉네임 변경 이력
            {nicknameHistory.length > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-toss-orange/10 text-toss-orange text-[11px] font-bold">{nicknameHistory.length}회</span>}
          </h2>
          {nicknameHistory.length > 0 ? (
            <div className="space-y-0">
              {nicknameHistory.map((entry, i) => (
                <div key={entry.id} className="relative pl-6 pb-4 last:pb-0">
                  {i < nicknameHistory.length - 1 && <div className="absolute left-[9px] top-5 bottom-0 w-px bg-toss-gray-200 dark:bg-toss-gray-700" />}
                  <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-toss-orange/15 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-toss-orange" /></div>
                  <div>
                    <p className="text-[13px] leading-snug">
                      <span className="text-toss-gray-400 line-through">{entry.oldNickname}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="inline mx-1.5 -mt-px"><path d="M2.5 6H9.5M9.5 6L7 3.5M9.5 6L7 8.5" stroke="#b0b8c1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span className="text-foreground font-medium">{entry.newNickname}</span>
                    </p>
                    <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatRelativeTime(entry.detectedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10H16M8 6L4 10L8 14M12 6L16 10L12 14" stroke="#b0b8c1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-[13px] text-toss-gray-400">닉네임 변경 이력이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Comments ─── */}
      <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-toss mb-4">
        <h2 className="text-[15px] font-semibold text-foreground mb-5">댓글 {comments.length > 0 && <span className="text-toss-gray-400 font-normal ml-1.5">{comments.length}</span>}</h2>
        <div className="flex gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
            {authUser?.image ? <img src={authUser.image} alt="" className="w-full h-full object-cover" /> : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 7C8.38 7 9.5 5.88 9.5 4.5S8.38 2 7 2 4.5 3.12 4.5 4.5 5.62 7 7 7ZM7 8.25C5.33 8.25 2 9.09 2 10.75V12H12V10.75C12 9.09 8.67 8.25 7 8.25Z" fill="#b0b8c1"/></svg>}
          </div>
          <div className="flex-1 relative">
            <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && commentText.trim()) handleComment(); }} placeholder="의견을 남겨주세요" className="w-full h-10 pl-4 pr-16 rounded-full bg-secondary border border-border/50 text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            <button disabled={!commentText.trim()} onClick={handleComment} className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3.5 rounded-full bg-primary text-white text-[12px] font-semibold disabled:opacity-30">등록</button>
          </div>
        </div>
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                <Link href={`/profile/${comment.user.id}`} className="w-7 h-7 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all">
                  {comment.user.image ? <img src={comment.user.image} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-toss-gray-500">{(comment.user.nickname || "?").charAt(0)}</span>}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/profile/${comment.user.id}`} className="text-[12px] font-semibold text-foreground hover:opacity-80">{comment.user.nickname || "익명"}</Link>
                    {comment.user.barracksVerified && (
                      <span className="w-[14px] h-[14px] rounded-full bg-primary flex items-center justify-center shrink-0">
                        <svg width="7" height="7" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                    <span className="text-[11px] text-toss-gray-400">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-[13px] text-toss-gray-700 dark:text-toss-gray-300 mt-0.5 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6"><p className="text-[13px] text-toss-gray-400">아직 댓글이 없습니다</p></div>
        )}
      </div>

      {/* ─── 이 유저의 다른 신고 내역 ─── */}
      {relatedReports && (relatedReports.hackReports.length > 0 || relatedReports.mannerReports.length > 0) && (
        <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-toss mb-4">
          <h2 className="text-[15px] font-semibold text-foreground mb-3">이 유저의 다른 신고</h2>
          {relatedReports.hackReports.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-[11px] font-semibold text-toss-gray-500 uppercase tracking-wider">핵 신고</p>
              {relatedReports.hackReports.map((r) => (
                <Link key={r.id} href={`/reports/${r.id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary/40 transition-colors">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${r.status === "CONFIRMED" ? "bg-toss-red text-white" : r.status === "PROBABLE" ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"}`}>
                    {r.status === "CONFIRMED" ? "확정" : r.status === "PROBABLE" ? "유력" : "의심"}
                  </span>
                  <p className="text-[13px] font-medium text-foreground truncate flex-1">{r.nickname}</p>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-toss-gray-300 shrink-0"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              ))}
            </div>
          )}
          {relatedReports.mannerReports.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-toss-gray-500 uppercase tracking-wider">비매너 신고</p>
              {relatedReports.mannerReports.map((r) => (
                <Link key={r.id} href={`/manner/${r.id}`} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary/40 transition-colors">
                  <p className="text-[13px] font-medium text-foreground truncate flex-1">{r.nickname}</p>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-toss-gray-300 shrink-0"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-toss-gray-400 text-center leading-relaxed mt-6 px-4">
        {type === "hack" ? "본 정보는 커뮤니티 제보에 기반하며, SALog는 정보의 정확성을 보장하지 않습니다." : "비매너 신고는 커뮤니티 기반 참고 정보이며, 공식적인 제재와 무관합니다."}
      </p>

      {/* ─── 편집 모달 ─── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <div className="relative w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-border/40 shadow-toss-lg animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-toss-gray-200 dark:bg-toss-gray-700" />
            </div>
            <div className="px-6 pt-4 sm:pt-6 pb-6 space-y-5">
              <h2 className="text-[20px] font-bold text-foreground">게시글 수정</h2>

              {/* 카테고리 */}
              {type === "hack" && (
                <div>
                  <label className="block text-[12px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-2">핵 유형</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(HACK_TYPE_LABELS).map(([key, info]) => (
                      <button key={key}
                        onClick={() => setEditHackTypes((prev) => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key])}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${
                          editHackTypes.includes(key) ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "bg-secondary text-toss-gray-600"
                        }`}
                      >{info.icon} {info.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {type === "manner" && (
                <div>
                  <label className="block text-[12px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-2">비매너 유형</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(MANNER_TAG_MAP).map(([key, info]) => (
                      <button key={key}
                        onClick={() => setEditTagTypes((prev) => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key])}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${
                          editTagTypes.includes(key) ? "bg-toss-orange/10 text-toss-orange ring-1 ring-toss-orange/30" : "bg-secondary text-toss-gray-600"
                        }`}
                      >{info.emoji} {info.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* 신고 사유 */}
              <div>
                <label className="block text-[12px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-2">신고 사유</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value.slice(0, 1000))}
                  rows={5}
                  className="w-full px-4 py-3 rounded-2xl bg-toss-gray-50 dark:bg-secondary border border-border/50 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed placeholder:text-toss-gray-400"
                  placeholder="신고 사유를 입력해주세요"
                />
                <p className="text-[11px] text-toss-gray-400 mt-1.5 text-right tabular-nums">{editDescription.length}/1,000</p>
              </div>

              {/* 증거자료 */}
              <div>
                <label className="block text-[12px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-2">
                  증거 자료 <span className="text-toss-gray-400 font-normal normal-case">{editEvidences.length}개</span>
                </label>
                {editEvidences.length > 0 ? (
                  <div className="space-y-2">
                    {editEvidences.map((ev, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-toss-gray-50 dark:bg-secondary">
                        {/* 썸네일 미니 */}
                        <div className="w-10 h-10 rounded-lg bg-toss-gray-200 dark:bg-toss-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {ev.type === "screenshot" ? (
                            <img src={ev.url} alt="" className="w-full h-full object-cover" />
                          ) : ev.type === "youtube" ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l6 4-6 4V4z" fill="#f04452"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="#6b7684" strokeWidth="1.2" strokeLinecap="round"/></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-foreground truncate">{ev.name}</p>
                          <p className="text-[10px] text-toss-gray-400 truncate">{ev.type === "screenshot" ? "스크린샷" : ev.type === "youtube" ? "YouTube" : "링크"}</p>
                        </div>
                        {/* 순서 변경 */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button disabled={i === 0} onClick={() => moveEvidence(i, i - 1)} className="w-6 h-5 rounded flex items-center justify-center hover:bg-toss-gray-200 dark:hover:bg-toss-gray-600 disabled:opacity-20">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 6.5L5 3.5L8 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-toss-gray-500"/></svg>
                          </button>
                          <button disabled={i === editEvidences.length - 1} onClick={() => moveEvidence(i, i + 1)} className="w-6 h-5 rounded flex items-center justify-center hover:bg-toss-gray-200 dark:hover:bg-toss-gray-600 disabled:opacity-20">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-toss-gray-500"/></svg>
                          </button>
                        </div>
                        {/* 삭제 */}
                        <button onClick={() => setEditEvidences((prev) => prev.filter((_, j) => j !== i))} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#f04452" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-toss-gray-400 text-center py-4">증거 자료가 없습니다</p>
                )}

                {/* 증거 추가 */}
                <div className="flex gap-2 mt-3">
                  <label className="flex-1 h-9 rounded-xl bg-secondary flex items-center justify-center gap-1.5 text-[12px] font-medium text-toss-gray-600 hover:bg-secondary/80 cursor-pointer transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    스크린샷
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      try {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 4 * 1024 * 1024) { alert("4MB 이하 파일만 가능합니다"); return; }
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/upload", { method: "POST", body: fd });
                        if (res.status === 413) { alert("파일이 너무 큽니다"); return; }
                        const data = await res.json().catch(() => null);
                        if (res.ok && data?.url) {
                          setEditEvidences((prev) => [...prev, { type: data.type || "screenshot", url: data.url, name: data.name || file.name }]);
                        } else { alert(data?.error || "업로드에 실패했습니다"); }
                      } catch { alert("업로드 중 오류가 발생했습니다"); }
                      finally { e.target.value = ""; }
                    }} />
                  </label>
                  <button
                    onClick={() => {
                      const url = prompt("YouTube URL 또는 링크를 입력하세요");
                      if (!url?.trim()) return;
                      const isYt = /youtu\.?be/.test(url);
                      setEditEvidences((prev) => [...prev, { type: isYt ? "youtube" : "link", url: url.trim(), name: isYt ? "YouTube" : url.trim() }]);
                    }}
                    className="flex-1 h-9 rounded-xl bg-secondary flex items-center justify-center gap-1.5 text-[12px] font-medium text-toss-gray-600 hover:bg-secondary/80 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    링크 추가
                  </button>
                </div>
              </div>

              {/* 액션 */}
              <div className="flex gap-3">
                <button onClick={() => setIsEditing(false)} className="flex-1 h-12 rounded-2xl bg-secondary text-[15px] font-semibold text-toss-gray-600 transition-all active:scale-[0.98]">취소</button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSavingEdit ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 유도 팝업 */}
      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
    </div>
  );
}
