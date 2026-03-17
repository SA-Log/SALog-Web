"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { LoginPrompt } from "@/components/common/login-prompt";
import { HACK_STATUS_MAP, MANNER_TAG_MAP } from "@/lib/mock-data";

type BarracksProfile = {
  nickname: string;
  nexonSn: number;
  userImg: string | null;
  level: number;
  clanName: string | null;
  userIntro: string;
};

type HackReport = { id: string; nickname: string; status: string; hackTypes: string[]; createdAt: string };
type MannerReport = { id: string; nickname: string; tagType: string; tagTypes: string[]; createdAt: string };

function formatDate(d: string) { const dt = new Date(d); return `${dt.getFullYear()}.${dt.getMonth()+1}.${dt.getDate()}`; }

export default function BarracksUserPage({ params }: { params: Promise<{ nexonSn: string }> }) {
  const { nexonSn } = use(params);
  const { isLoggedIn } = useAuth();
  const [profile, setProfile] = useState<BarracksProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [hackReports, setHackReports] = useState<HackReport[]>([]);
  const [mannerReports, setMannerReports] = useState<MannerReport[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // 프로필 조회
        const res = await fetch(`/api/barracks/profile?nexonSn=${nexonSn}`);
        const data = await res.json();
        if (data.found) {
          setProfile(data);
        } else {
          setNotFound(true);
        }

        // SALog 연동 — 핵/비매너 신고 내역
        const searchRes = await fetch(`/api/search?q=${nexonSn}&type=barracks`);
        const searchData = await searchRes.json();
        setHackReports(searchData.hackReports ?? []);
        setMannerReports(searchData.mannerReports ?? []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [nexonSn]);

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-md px-5 py-8">
        <div className="bg-card rounded-3xl border border-border/40 shadow-toss p-6 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 mb-4" />
            <div className="h-6 w-32 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800 mb-2" />
            <div className="h-4 w-24 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto max-w-screen-md px-5 py-16 text-center">
        <p className="text-[15px] text-toss-gray-500 font-medium">유저를 찾을 수 없습니다</p>
        <Link href="/search" className="text-[13px] text-primary mt-4 inline-block">검색으로 돌아가기</Link>
      </div>
    );
  }

  const barracksUrl = `https://barracks.sa.nexon.com/${nexonSn}/match`;

  function handleReport() {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    // 핵 신고 페이지로 이동 (병영주소 자동 입력)
    window.location.href = `/reports/new`;
  }

  return (
    <div className="mx-auto max-w-screen-md px-5 py-8">
      {/* 뒤로가기 */}
      <Link href="/search" className="inline-flex items-center gap-1 text-[13px] text-toss-gray-500 hover:text-foreground transition-colors mb-5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        검색으로
      </Link>

      {/* 프로필 카드 */}
      <div className="bg-card rounded-3xl border border-border/40 shadow-toss overflow-hidden mb-6">
        <div className="px-6 pt-6 pb-5 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center overflow-hidden ring-4 ring-card shadow-toss-md mb-4">
            {profile.userImg ? (
              <img src={profile.userImg} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[28px] font-bold text-toss-gray-500">{profile.nickname.charAt(0)}</span>
            )}
          </div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">{profile.nickname}</h1>
          <p className="text-[13px] text-toss-gray-500 mt-1">
            Lv.{profile.level}{profile.clanName ? ` · ${profile.clanName}` : ""}
          </p>
          {profile.userIntro && (
            <p className="text-[13px] text-toss-gray-400 mt-2 max-w-xs leading-relaxed">{profile.userIntro}</p>
          )}

          {/* 병영수첩 바로가기 + 신고하기 */}
          <div className="flex gap-2.5 mt-5">
            <a href={barracksUrl} target="_blank" rel="noopener noreferrer"
              className="h-9 px-5 rounded-full bg-primary/10 text-primary text-[12px] font-semibold flex items-center gap-1.5 transition-all hover:bg-primary/20 active:scale-[0.97]">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              병영수첩
            </a>
            <button onClick={handleReport}
              className="h-9 px-5 rounded-full bg-toss-red/10 text-toss-red text-[12px] font-semibold flex items-center gap-1.5 transition-all hover:bg-toss-red/20 active:scale-[0.97]">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              이 유저 신고하기
            </button>
          </div>
        </div>
      </div>

      {/* SALog 연동 */}
      <h2 className="text-[15px] font-bold text-foreground mb-4">SALog 연동</h2>

      {/* 핵 신고 내역 */}
      {hackReports.length > 0 ? (
        <div className="mb-6">
          <h3 className="text-[12px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-2">핵 신고 내역</h3>
          <div className="bg-card rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/20">
            {hackReports.map((r) => {
              const statusInfo = HACK_STATUS_MAP[r.status as keyof typeof HACK_STATUS_MAP];
              return (
                <Link key={r.id} href={`/reports/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-foreground truncate">{r.nickname}</p>
                      {statusInfo && <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span>}
                    </div>
                    <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatDate(r.createdAt)}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-toss-gray-300 shrink-0"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-card rounded-2xl border border-border/30 p-5 text-center">
          <p className="text-[13px] text-toss-gray-400">핵 신고 내역이 없습니다</p>
        </div>
      )}

      {/* 비매너 신고 내역 */}
      {mannerReports.length > 0 ? (
        <div className="mb-6">
          <h3 className="text-[12px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-2">비매너 신고 내역</h3>
          <div className="bg-card rounded-2xl border border-border/30 overflow-hidden divide-y divide-border/20">
            {mannerReports.map((r) => {
              const types = r.tagTypes?.length ? r.tagTypes : [r.tagType];
              return (
                <Link key={r.id} href={`/manner/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-foreground truncate">{r.nickname}</p>
                      {types.slice(0, 2).map((t) => {
                        const info = MANNER_TAG_MAP[t as keyof typeof MANNER_TAG_MAP] ?? MANNER_TAG_MAP.OTHER;
                        return <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${info.bg} ${info.color}`}>{info.emoji}</span>;
                      })}
                    </div>
                    <p className="text-[11px] text-toss-gray-400 mt-0.5">{formatDate(r.createdAt)}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-toss-gray-300 shrink-0"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-card rounded-2xl border border-border/30 p-5 text-center">
          <p className="text-[13px] text-toss-gray-400">비매너 신고 내역이 없습니다</p>
        </div>
      )}

      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
    </div>
  );
}
