"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/common/auth-guard";

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [barracksUrl, setBarracksUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/sa-verification/code")
      .then((res) => res.json())
      .then((data) => {
        if (data.code) setCode(data.code);
        if (data.pending) setPending(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  }

  function extractNexonSn(input: string): string | null {
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) return trimmed;
    const match = trimmed.match(/barracks\.sa\.nexon\.com\/(\d+)/);
    return match ? match[1] : null;
  }

  async function handleSubmit() {
    const sn = extractNexonSn(barracksUrl);
    if (!sn) {
      setError("올바른 병영주소를 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/sa-verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nexonSn: sn }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error || "인증에 실패했습니다");
        return;
      }
      if (data.verified) {
        // 세션 갱신하여 인증 마크 즉시 반영
        await fetch("/api/auth/refresh-session", { method: "POST" }).catch(() => {});
        setSuccess(true);
      } else {
        setError(data.error || "자기소개에서 인증 코드를 찾을 수 없습니다");
      }
    } catch {
      setError("서버 연결에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-screen-sm px-5 py-8">
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
            <p className="text-[13px] text-toss-gray-500 animate-pulse text-center">로딩 중...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (success) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-screen-sm px-5 py-8">
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-toss-green/10 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M9 14.5l3 3 7-7.5" stroke="#30b87e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-foreground mb-2">인증 완료!</h2>
            <p className="text-[13px] text-toss-gray-500 mb-6">서든어택 계정이 성공적으로 인증되었습니다.</p>
            <a href="/profile" className="inline-flex h-11 px-6 rounded-xl bg-primary text-white text-[14px] font-semibold items-center btn-primary">
              프로필로 돌아가기
            </a>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (pending) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-screen-sm px-5 py-8">
          <div className="mb-6">
            <Link href="/profile" className="inline-flex items-center gap-1.5 text-[13px] text-toss-gray-500 hover:text-foreground transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              프로필로 돌아가기
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7" stroke="#f59f00" strokeWidth="1.5"/>
                  <path d="M10 7v3.5l2.5 1.5" stroke="#f59f00" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-foreground">인증 심사 중</h3>
                <p className="text-[12px] text-amber-500 font-medium">자기소개를 변경하지 마세요</p>
              </div>
            </div>
            <p className="text-[12px] text-toss-gray-500">인증 코드가 확인될 때까지 병영수첩 자기소개를 유지해주세요.</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="mx-auto max-w-screen-sm px-5 py-8">
        <div className="mb-6">
          <Link href="/profile" className="inline-flex items-center gap-1.5 text-[13px] text-toss-gray-500 hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            프로필로 돌아가기
          </Link>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5 space-y-5">
          <div>
            <h2 className="text-[18px] font-bold text-foreground">병영수첩 인증</h2>
            <p className="text-[12px] text-toss-gray-500 mt-1">서든어택 계정 소유를 인증합니다</p>
          </div>

          {/* 인증 코드 */}
          <div className="rounded-xl p-4 bg-secondary border border-border/30 text-center">
            <p className="text-[11px] text-toss-gray-500 mb-1">인증 코드</p>
            <p className="text-[28px] font-mono font-bold text-primary tracking-widest">{code}</p>
            <button
              onClick={handleCopy}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  복사됨
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M9.5 4.5V3a1.5 1.5 0 00-1.5-1.5H3A1.5 1.5 0 001.5 3v5A1.5 1.5 0 003 9.5h1.5" stroke="currentColor" strokeWidth="1.2"/></svg>
                  코드 복사
                </>
              )}
            </button>
          </div>

          {/* 튜토리얼 */}
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-foreground">인증 방법</p>
            <div className="space-y-2.5">
              {[
                { step: 1, text: <>위 <span className="font-semibold text-primary">인증 코드</span>를 복사하세요</> },
                { step: 2, text: <><a href="https://barracks.sa.nexon.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">병영수첩</a>에 로그인 후 <span className="font-semibold">프로필 편집</span>으로 이동하세요</> },
                { step: 3, text: <><span className="font-semibold">자기소개</span>에 인증 코드를 붙여넣고 <span className="font-semibold">저장</span>하세요</> },
                { step: 4, text: <>아래에 병영주소를 입력하고 <span className="font-semibold">인증 확인</span>을 누르세요</> },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">{step}</span>
                  </div>
                  <p className="text-[12px] text-toss-gray-700 dark:text-toss-gray-300 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 병영주소 입력 */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">병영주소</label>
            <input
              type="text"
              value={barracksUrl}
              onChange={(e) => { setBarracksUrl(e.target.value); setError(""); }}
              placeholder="https://barracks.sa.nexon.com/1234567890/match"
              className="w-full h-11 px-4 rounded-xl bg-card border border-border text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
          </div>

          {error && <p className="text-[12px] text-toss-red text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!barracksUrl.trim() || isSubmitting}
            className="w-full h-11 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-40 btn-primary"
          >
            {isSubmitting ? "확인 중..." : "인증 확인"}
          </button>

          {/* 주의사항 */}
          <div className="rounded-xl p-3 bg-amber-500/5 border border-amber-500/10">
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              인증 완료 전까지 병영수첩 자기소개를 변경하지 마세요. 코드가 확인되지 않으면 인증이 실패합니다.
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
