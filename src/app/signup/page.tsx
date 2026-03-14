"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SignupPageWrapper() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-sm px-5 py-10 min-h-screen flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-lg font-bold">SA</span>
        </div>
        <p className="text-[13px] text-toss-gray-500 animate-pulse">로딩 중...</p>
      </div>
    }>
      <SignupPage />
    </Suspense>
  );
}

function SignupPage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();

  const [barracksUrl, setBarracksUrl] = useState("");
  const [nickname, setNickname] = useState("");
  const [nexonSn, setNexonSn] = useState("");
  const [email, setEmail] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [isLooking, setIsLooking] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  function extractNexonSn(input: string): string | null {
    const trimmed = input.trim();
    // 순수 숫자인 경우
    if (/^\d+$/.test(trimmed)) return trimmed;
    // URL에서 숫자 추출: https://barracks.sa.nexon.com/1443173862/match
    const match = trimmed.match(/barracks\.sa\.nexon\.com\/(\d+)/);
    return match ? match[1] : null;
  }

  async function handleLookup() {
    const sn = extractNexonSn(barracksUrl);
    if (!sn) {
      setLookupError("올바른 병영주소를 입력해주세요");
      return;
    }

    setIsLooking(true);
    setLookupError("");
    setLookupDone(false);
    setNickname("");
    setNexonSn("");

    try {
      const res = await fetch(`/api/barracks/profile?nexonSn=${sn}`);
      const data = await res.json();

      if (!res.ok || !data.found) {
        setLookupError(data.error || "해당 병영주소의 유저를 찾을 수 없습니다");
        return;
      }

      setNickname(data.nickname);
      setNexonSn(sn);
      setLookupDone(true);
    } catch {
      setLookupError("조회 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLooking(false);
    }
  }

  const canSubmit = lookupDone && nickname && !isSubmitting;

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          barracksAddress: nexonSn,
          notificationEmail: email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "가입에 실패했습니다");
        setIsSubmitting(false);
        return;
      }
      const refreshRes = await fetch("/api/auth/refresh-session", {
        method: "POST",
      });
      if (!refreshRes.ok) {
        try { await updateSession(); } catch { /* ignore */ }
      }
      window.location.href = "/";
      return;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "서버 연결에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-sm px-5 py-10 min-h-screen flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-lg font-bold">SA</span>
        </div>
        <p className="text-[13px] text-toss-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-10 min-h-screen flex flex-col justify-center">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-lg font-bold">SA</span>
        </div>
        <h1 className="text-[22px] font-bold text-foreground">회원가입</h1>
        <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400 mt-2">
          병영주소를 입력하면 서든어택 닉네임이 자동으로 설정됩니다.
        </p>
      </div>

      {/* 카카오 연동 완료 배너 */}
      {session?.user && (
        <div className="rounded-xl p-3 border bg-toss-green-light dark:bg-toss-green/10 border-toss-green/20 mb-6 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="9" fill="#30b87e" fillOpacity="0.15"/>
            <path d="M5 9L8 12L13 6" stroke="#30b87e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <p className="text-[12px] font-semibold text-foreground">카카오 계정 연동 완료</p>
            <p className="text-[11px] text-toss-gray-500">{session.user.name ?? "카카오 로그인이 설정되었습니다"}</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* 병영주소 */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-2">
            병영주소 <span className="text-toss-red">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barracksUrl}
              onChange={(e) => { setBarracksUrl(e.target.value); setLookupDone(false); setLookupError(""); setNickname(""); }}
              placeholder="https://barracks.sa.nexon.com/1234567890/match"
              className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
            <button
              onClick={handleLookup}
              disabled={!barracksUrl.trim() || isLooking}
              className="h-11 px-4 rounded-xl bg-secondary text-toss-gray-700 dark:text-toss-gray-300 text-[13px] font-semibold disabled:opacity-40 btn-secondary shrink-0"
            >
              {isLooking ? "조회 중..." : "조회"}
            </button>
          </div>
          <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 mt-1.5">
            병영수첩 프로필 URL을 입력해주세요
          </p>
          {lookupError && (
            <p className="text-[11px] text-toss-red mt-1.5">{lookupError}</p>
          )}
        </div>

        {/* 조회 결과 */}
        {lookupDone && nickname && (
          <div className="rounded-xl p-4 border border-toss-green/20 bg-toss-green/5 dark:bg-toss-green/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-toss-green/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M6 10l3 3 5-5" stroke="#30b87e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-bold text-foreground">{nickname}</p>
                <p className="text-[11px] text-toss-green font-medium">유저 확인 완료 — 이 닉네임으로 가입됩니다</p>
              </div>
            </div>
          </div>
        )}

        {/* 이메일 */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-2">
            이메일 <span className="text-[11px] font-normal text-toss-gray-500 dark:text-toss-gray-400">(선택)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full h-11 px-4 rounded-xl bg-card border border-border text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
          <div className="rounded-xl p-3 border border-toss-orange/20 bg-toss-orange-light dark:bg-toss-orange/10 mt-2">
            <div className="flex gap-2 items-start">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
                <path d="M8 1L14.93 13H1.07L8 1Z" stroke="#f59f00" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M8 6V9M8 11V11.5" stroke="#f59f00" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <p className="text-[11px] text-toss-orange/80 leading-relaxed">
                이메일 미등록 시 블랙리스트 닉변 알림, 신고 상태 변경 알림을 받을 수 없습니다.
              </p>
            </div>
          </div>
        </div>

        {submitError && (
          <p className="text-[12px] text-toss-red text-center">{submitError}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-12 rounded-xl bg-primary text-white text-[14px] font-semibold disabled:opacity-40 btn-primary"
        >
          {isSubmitting ? "가입 중..." : "가입 완료"}
        </button>
      </div>

      <p className="text-[11px] text-toss-gray-500 dark:text-toss-gray-400 text-center mt-8 leading-relaxed">
        가입 시 <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">이용약관</a> 및{" "}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">개인정보처리방침</a>에 동의하게 됩니다.
      </p>
    </div>
  );
}
