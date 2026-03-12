"use client";

import { use, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/hack/status-badge";
import { ReporterInfo, TitleBadge, RankBadge, AccuracyBadge } from "@/components/common/title-badge";
import { AuthGuard } from "@/components/common/auth-guard";
import { mockHackReports, mockComments, formatRelativeTime, ROLE_MAP } from "@/lib/mock-data";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const report = mockHackReports.find((r) => r.id === id);
  type VoteType = "AGREE" | "UNSURE" | "DISAGREE";
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [agreeOffset, setAgreeOffset] = useState(0);
  const [unsureOffset, setUnsureOffset] = useState(0);
  const [disagreeOffset, setDisagreeOffset] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [isBlacklisted, setIsBlacklisted] = useState(false);

  function handleVote(type: VoteType) {
    if (hasVoted) return;
    setUserVote(type);
    setHasVoted(true);
    if (type === "AGREE") setAgreeOffset(1);
    else if (type === "UNSURE") setUnsureOffset(1);
    else setDisagreeOffset(1);
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-screen-lg px-5 py-16 text-center">
        <p className="text-[14px] text-toss-gray-400">신고를 찾을 수 없습니다</p>
        <Link href="/reports" className="text-[13px] text-primary mt-4 inline-block">목록으로 돌아가기</Link>
      </div>
    );
  }

  const currentAgree = report.agreeCount + agreeOffset;
  const currentUnsure = report.unsureCount + unsureOffset;
  const currentDisagree = report.disagreeCount + disagreeOffset;
  const voteTotal = currentAgree + currentUnsure + currentDisagree;
  const agreePercent = voteTotal > 0 ? Math.round((currentAgree / voteTotal) * 100) : 0;
  const unsurePercent = voteTotal > 0 ? Math.round((currentUnsure / voteTotal) * 100) : 0;
  const disagreePercent = voteTotal > 0 ? 100 - agreePercent - unsurePercent : 0;

  return (
    <AuthGuard>
    <div className="mx-auto max-w-screen-lg px-5 py-6">
      <Link href="/reports" className="inline-flex items-center gap-1 text-[13px] text-toss-gray-500 hover:text-foreground transition-toss mb-5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        목록으로
      </Link>

      {/* Main info */}
      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-toss mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <StatusBadge status={report.status} />
            <h1 className="text-[22px] font-bold text-foreground mt-2">{report.nickname}</h1>
            <a href={report.barracksAddress} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[12px] font-medium hover:bg-primary/20 transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              병영주소 바로가기
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 7L7 3M7 3H4M7 3V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
          <button
            onClick={() => setIsBlacklisted(!isBlacklisted)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold btn-ghost ${
              isBlacklisted
                ? "bg-toss-gray-100 dark:bg-toss-gray-800 text-toss-gray-600 dark:text-toss-gray-400 border border-border"
                : "bg-toss-red text-white"
            }`}
          >
            {isBlacklisted ? "블랙리스트 해제" : "블랙리스트 추가"}
          </button>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-secondary">
          <p className="text-[13px] text-toss-gray-700 dark:text-toss-gray-300 leading-relaxed">{report.description}</p>
        </div>

        {/* Reporter */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-[11px] text-toss-gray-400 mb-2">신고자</p>
          <ReporterInfo
            name={report.reporterName}
            accuracy={report.reporterAccuracy}
            kills={report.reporterKills}
            deaths={report.reporterDeaths}
            title={report.reporterTitle}
            rank={report.reporterRank}
            size="md"
            href={`/profile/${report.reporterId}`}
          />
        </div>

        <p className="text-[12px] text-toss-gray-400 mt-3">{formatRelativeTime(report.createdAt)}</p>
      </div>

      {/* Admin verdict */}
      {report.adminVerdict && (() => {
        const v = report.adminVerdict;
        const roleInfo = ROLE_MAP[v.adminRole];
        const verdictStyle = {
          CONFIRMED: { bg: "bg-toss-red/5", border: "border-toss-red/20", icon: "text-toss-red", label: "핵 확정", labelBg: "bg-toss-red/10 text-toss-red" },
          PROBABLE: { bg: "bg-amber-400/5", border: "border-amber-400/20", icon: "text-amber-500", label: "핵 유력", labelBg: "bg-amber-400/10 text-amber-500" },
          DISMISSED: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", icon: "text-emerald-500", label: "기각", labelBg: "bg-emerald-500/10 text-emerald-500" },
          SUSPECT: { bg: "bg-secondary", border: "border-border/50", icon: "text-toss-gray-500", label: "핵 의심", labelBg: "bg-secondary text-toss-gray-500" },
        }[v.status];

        return (
          <div className={`rounded-2xl p-5 border shadow-toss mb-4 ${verdictStyle.bg} ${verdictStyle.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={verdictStyle.icon}>
                <path d="M9 1.5L11.3 6.2L16.5 6.9L12.75 10.5L13.6 15.7L9 13.3L4.4 15.7L5.25 10.5L1.5 6.9L6.7 6.2L9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h2 className="text-[14px] font-bold text-foreground">관리자 판정</h2>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${verdictStyle.labelBg}`}>{verdictStyle.label}</span>
            </div>
            <div className="bg-card/80 rounded-xl p-4">
              <p className="text-[13px] text-foreground leading-relaxed">{v.reason}</p>
            </div>
            <div className="flex items-center gap-2 mt-3 text-[12px] text-toss-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-primary">{v.adminName.charAt(0)}</span>
                </div>
                <span className="font-medium text-foreground">{v.adminName}</span>
                <span className={`text-[10px] font-bold ${roleInfo.color}`}>{roleInfo.label}</span>
              </div>
              <span className="text-toss-gray-400">·</span>
              <span>{formatRelativeTime(v.decidedAt)}</span>
            </div>
          </div>
        );
      })()}

      {/* YouTube */}
      {report.youtubeUrl && (
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-toss mb-4">
          <h2 className="text-[14px] font-semibold text-foreground mb-3">증거 영상</h2>
          <a href={report.youtubeUrl} target="_blank" rel="noopener noreferrer" className="block relative aspect-video rounded-xl overflow-hidden bg-toss-gray-100 dark:bg-secondary group">
            {(() => {
              const m = report.youtubeUrl!.match(/(?:v=|\/)([\w-]{11})/);
              return m ? <img src={`https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`} alt="영상 썸네일" className="absolute inset-0 w-full h-full object-cover" /> : null;
            })()}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <rect width="56" height="56" rx="28" fill="black" fillOpacity="0.5"/>
                <path d="M22 18V38L38 28L22 18Z" fill="white"/>
              </svg>
            </div>
          </a>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* Vote */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-toss">
          <h2 className="text-[14px] font-semibold text-foreground mb-4">커뮤니티 투표</h2>
          <div className="mb-4">
            {/* 3-bar vote display */}
            <div className="space-y-2.5">
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-toss-red font-semibold">핵 맞음</span>
                  <span className="text-toss-red font-bold">{currentAgree}<span className="text-toss-gray-400 font-normal ml-1">({agreePercent}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-toss-gray-100 dark:bg-toss-gray-700 overflow-hidden">
                  <div className="h-full rounded-full bg-toss-red transition-all duration-500" style={{ width: `${agreePercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-amber-500 font-semibold">잘 모르겠음</span>
                  <span className="text-amber-500 font-bold">{currentUnsure}<span className="text-toss-gray-400 font-normal ml-1">({unsurePercent}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-toss-gray-100 dark:bg-toss-gray-700 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${unsurePercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-toss-blue font-semibold">핵 아님</span>
                  <span className="text-toss-blue font-bold">{currentDisagree}<span className="text-toss-gray-400 font-normal ml-1">({disagreePercent}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-toss-gray-100 dark:bg-toss-gray-700 overflow-hidden">
                  <div className="h-full rounded-full bg-toss-blue transition-all duration-500" style={{ width: `${disagreePercent}%` }} />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-toss-gray-400 mt-2.5 text-center">총 {voteTotal}명 참여</p>
          </div>
          {hasVoted ? (
            <div className="text-center py-2">
              <p className="text-[12px] text-toss-gray-500">
                <span className={`font-semibold ${
                  userVote === "AGREE" ? "text-toss-red" : userVote === "UNSURE" ? "text-amber-500" : "text-toss-blue"
                }`}>
                  {userVote === "AGREE" ? "핵 맞음" : userVote === "UNSURE" ? "잘 모르겠음" : "핵 아님"}
                </span>에 투표했습니다
              </p>
              <p className="text-[11px] text-toss-gray-400 mt-0.5">투표는 수정할 수 없습니다</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => handleVote("AGREE")}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold btn-vote bg-toss-red text-white hover:opacity-80">
                핵 맞음
              </button>
              <button onClick={() => handleVote("UNSURE")}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold btn-vote bg-amber-400 text-white hover:opacity-80">
                잘 모르겠음
              </button>
              <button onClick={() => handleVote("DISAGREE")}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold btn-vote bg-toss-blue text-white hover:opacity-80">
                핵 아님
              </button>
            </div>
          )}
        </div>

        {/* Nickname history */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-toss">
          <h2 className="text-[14px] font-semibold text-foreground mb-4 flex items-center gap-2">
            닉네임 변경 이력
            {report.nicknameHistory.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-toss-orange/10 text-toss-orange text-[11px] font-bold">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 3.5H9.5M7.5 1.5L9.5 3.5L7.5 5.5M9.5 7.5H1.5M3.5 5.5L1.5 7.5L3.5 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {report.nicknameHistory.length}회
              </span>
            )}
          </h2>
          {report.nicknameHistory.length > 0 ? (
            <div className="space-y-3">
              {report.nicknameHistory.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-toss-orange-light flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5H9M9 5L6 2M9 5L6 8" stroke="#f59f00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px]">
                      <span className="text-toss-gray-400 line-through">{entry.oldNickname}</span>
                      <span className="text-toss-gray-300 mx-1.5">→</span>
                      <span className="text-foreground font-medium">{entry.newNickname}</span>
                    </p>
                    <p className="text-[11px] text-toss-gray-400">{formatRelativeTime(entry.detectedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6"><p className="text-[13px] text-toss-gray-400">닉네임 변경 이력이 없습니다</p></div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-toss mb-4">
        <h2 className="text-[14px] font-semibold text-foreground mb-4">
          댓글 <span className="text-toss-gray-400 font-normal">{mockComments.length}</span>
        </h2>
        <div className="flex gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-toss-gray-200 dark:bg-toss-gray-700 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 7C8.38 7 9.5 5.88 9.5 4.5S8.38 2 7 2 4.5 3.12 4.5 4.5 5.62 7 7 7ZM7 8.25C5.33 8.25 2 9.09 2 10.75V12H12V10.75C12 9.09 8.67 8.25 7 8.25Z" fill="#b0b8c1"/></svg>
          </div>
          <div className="flex-1 flex gap-2">
            <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요"
              className="flex-1 h-9 px-3 rounded-xl bg-secondary border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
            <button className="h-9 px-4 rounded-xl bg-primary text-white text-[12px] font-semibold btn-primary shrink-0">등록</button>
          </div>
        </div>
        <div className="space-y-4">
          {mockComments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <Link href={`/profile/${comment.userId}`} className="w-7 h-7 rounded-full bg-toss-gray-200 dark:bg-toss-gray-700 flex items-center justify-center shrink-0 mt-0.5 hover:opacity-80 transition-opacity">
                <span className="text-[10px] font-bold text-toss-gray-500">{comment.userName.charAt(0)}</span>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link href={`/profile/${comment.userId}`} className="text-[12px] font-semibold text-foreground hover:opacity-80 transition-opacity">{comment.userName}</Link>
                  <RankBadge rank={comment.userRank} />
                  <TitleBadge title={comment.userTitle} />
                  <span className="text-[11px] text-toss-gray-400">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="text-[13px] text-toss-gray-700 dark:text-toss-gray-300 mt-0.5 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-secondary border border-border">
        <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-500 leading-relaxed text-center">
          본 정보는 커뮤니티 제보에 기반하며, SALog는 정보의 정확성을 보장하지 않습니다.
          허위 신고 적발 시 서비스 이용이 제한될 수 있습니다.
        </p>
      </div>
    </div>
    </AuthGuard>
  );
}
