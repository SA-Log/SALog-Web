"use client";

import { useState } from "react";
import Link from "next/link";

const CHANNEL_TYPES = ["유튜브", "치지직", "SOOP", "기타"];

export default function CreatorApplyPage() {
  const [channelUrl, setChannelUrl] = useState("");
  const [channelType, setChannelType] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [barracksAddress, setBarracksAddress] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [contentLinks, setContentLinks] = useState(["", "", ""]);
  const [verificationVideoUrl, setVerificationVideoUrl] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateLink = (index: number, value: string) => {
    const next = [...contentLinks];
    next[index] = value;
    setContentLinks(next);
  };

  const isValid = channelUrl.trim() && channelType && followerCount.trim() &&
    introduction.trim().length >= 20 && contentLinks.filter((l) => l.trim()).length >= 1 &&
    verificationVideoUrl.trim() && agreed;

  if (submitted) {
    return (
      <div className="mx-auto max-w-screen-sm px-5 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-toss-green/10 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#00c471" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-[20px] font-bold text-foreground mb-2">신청이 완료되었습니다</h1>
        <p className="text-[14px] text-toss-gray-500 mb-6">마스터가 심사 후 결과를 알려드립니다.<br/>심사에는 영업일 기준 1~3일이 소요됩니다.</p>
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 mb-6 text-left">
          <p className="text-[12px] font-semibold text-amber-600 dark:text-amber-400 mb-1">인증 영상 안내</p>
          <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400">
            심사가 완료될 때까지 인증 영상을 삭제하거나 비공개로 전환하지 마세요.<br/>
            심사 중 영상이 확인되지 않으면 신청이 거절될 수 있습니다.
          </p>
        </div>
        <Link href="/" className="inline-flex h-10 px-6 rounded-xl bg-primary text-white text-[14px] font-semibold items-center btn-primary">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-sm px-5 py-8">
      <h1 className="text-[22px] font-bold text-foreground mb-2">인증 크리에이터 신청</h1>
      <p className="text-[14px] text-toss-gray-500 mb-8">
        서든어택 관련 콘텐츠를 제작하는 크리에이터라면 누구나 신청할 수 있습니다.
      </p>

      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-6">
        <p className="text-[13px] font-semibold text-primary mb-1.5">인증 크리에이터 혜택</p>
        <ul className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400 space-y-1">
          <li>• 닉네임 옆에 인증 크리에이터 뱃지 표시</li>
          <li>• 핵 유저 신고 시 명중률 가중치 적용</li>
          <li>• 대량 신고 등록 기능 이용 가능</li>
        </ul>
      </div>

      <div className="space-y-5">
        {/* Channel Type */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-2">채널 유형 *</label>
          <div className="flex gap-2 flex-wrap">
            {CHANNEL_TYPES.map((t) => (
              <button key={t} onClick={() => setChannelType(t)}
                className={`px-3 py-2 rounded-xl text-[13px] font-medium btn-chip ${
                  channelType === t ? "bg-primary text-white" : "bg-secondary text-toss-gray-600 border border-border"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Channel URL */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-2">채널 URL *</label>
          <input type="url" value={channelUrl} onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://www.youtube.com/@your-channel"
            className="w-full h-11 px-4 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {/* Follower count */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-2">구독자/팔로워 수 *</label>
          <input type="text" value={followerCount} onChange={(e) => setFollowerCount(e.target.value)}
            placeholder="예: 5,000"
            className="w-full h-11 px-4 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {/* Barracks Address */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-2">병영주소 (선택)</label>
          <input type="url" value={barracksAddress} onChange={(e) => setBarracksAddress(e.target.value)}
            placeholder="https://barracks.sa.nexon.com/..."
            className="w-full h-11 px-4 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {/* Content links */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-2">
            대표 콘텐츠 링크 * <span className="text-toss-gray-400 font-normal">(최소 1개)</span>
          </label>
          <div className="space-y-2">
            {contentLinks.map((link, i) => (
              <input key={i} type="url" value={link} onChange={(e) => updateLink(i, e.target.value)}
                placeholder={`콘텐츠 링크 ${i + 1}`}
                className="w-full h-11 px-4 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20" />
            ))}
          </div>
          {contentLinks.length < 5 && (
            <button onClick={() => setContentLinks([...contentLinks, ""])}
              className="mt-2 text-[12px] text-primary font-medium hover:underline">
              + 링크 추가
            </button>
          )}
        </div>

        {/* Verification Video — 핵심 인증 수단 */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-2">
            인증 영상 URL *
          </label>

          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 mb-3">
            <p className="text-[13px] font-semibold text-amber-600 dark:text-amber-400 mb-2">본인 확인용 인증 영상 업로드 방법</p>
            <ol className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400 space-y-2">
              <li className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center">1</span>
                <span>채널에 아래 제목으로 <strong className="text-foreground">공개 영상</strong>을 업로드하세요.</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center">2</span>
                <span>영상 내용은 자유입니다. (빈 화면, 간단한 인사 등)</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center">3</span>
                <span>심사 완료 후 영상을 삭제해도 됩니다.</span>
              </li>
            </ol>

            <div className="mt-3 bg-card rounded-lg p-3 border border-border/50">
              <p className="text-[11px] font-semibold text-toss-gray-500 mb-1">영상 제목 (아래 내용을 그대로 복사해서 사용하세요)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[13px] font-mono text-foreground bg-secondary rounded-lg px-3 py-2 select-all">
                  [SALog] 인증 크리에이터 심사 요청
                </code>
                <button onClick={() => navigator.clipboard.writeText("[SALog] 인증 크리에이터 심사 요청")}
                  className="shrink-0 h-8 px-3 rounded-lg bg-primary/10 text-primary text-[11px] font-medium btn-chip">
                  복사
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-toss-red/5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-toss-red shrink-0 mt-0.5">
                <path d="M7 4v3M7 9h.005M2.535 12h8.93c1.1 0 1.786-1.191 1.234-2.143L8.234 2.857c-.552-.952-1.916-.952-2.468 0L1.301 9.857C.749 10.809 1.435 12 2.535 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-[11px] text-toss-red/80">
                <strong>비공개 또는 일부공개 영상은 인증이 불가능합니다.</strong><br/>
                반드시 공개 설정으로 업로드해주세요.
              </p>
            </div>
          </div>

          <input type="url" value={verificationVideoUrl} onChange={(e) => setVerificationVideoUrl(e.target.value)}
            placeholder="인증 영상 URL을 입력하세요 (공개 영상만 가능)"
            className="w-full h-11 px-4 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20" />
          <p className="text-[11px] text-toss-gray-400 mt-1.5">
            위 채널 URL과 동일한 채널에 업로드된 영상이어야 합니다.
          </p>
        </div>

        {/* Introduction */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-2">
            자기소개 * <span className="text-toss-gray-400 font-normal">(최소 20자)</span>
          </label>
          <textarea value={introduction} onChange={(e) => setIntroduction(e.target.value)}
            placeholder="서든어택과 관련된 활동 내용을 자유롭게 작성해주세요."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          <p className="text-[11px] text-toss-gray-400 mt-1">{introduction.length}/20자 이상</p>
        </div>

        {/* Agreement */}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-border accent-primary" />
          <span className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
            제출한 정보가 사실임을 확인하며, 허위 정보 제출 시 인증이 취소될 수 있음에 동의합니다.
          </span>
        </label>

        {/* Submit */}
        <button onClick={() => setSubmitted(true)} disabled={!isValid}
          className={`w-full h-12 rounded-xl text-[15px] font-semibold transition-toss ${
            isValid
              ? "bg-primary text-white btn-primary"
              : "bg-secondary text-toss-gray-400 cursor-not-allowed"
          }`}>
          신청하기
        </button>
      </div>
    </div>
  );
}
