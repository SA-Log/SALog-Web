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

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  async function handleCheckNickname() {
    if (nickname.trim().length < 2) {
      setNicknameError("닉네임은 2자 이상이어야 합니다");
      return;
    }
    if (!/^[가-힣a-zA-Z0-9_]{2,12}$/.test(nickname.trim())) {
      setNicknameError("한글, 영문, 숫자, 밑줄만 사용 가능 (2~12자)");
      return;
    }
    setIsCheckingNickname(true);
    setNicknameError("");
    try {
      const res = await fetch("/api/auth/check-nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const data = await res.json();
      setNicknameAvailable(data.available);
      if (!data.available) setNicknameError("이미 사용 중인 닉네임입니다");
    } catch {
      setNicknameError("확인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsCheckingNickname(false);
    }
  }

  const canSubmit = nickname.trim().length >= 2 && nicknameAvailable === true;

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          notificationEmail: email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "가입에 실패했습니다");
        setIsSubmitting(false);
        return;
      }
      // JWT 쿠키를 직접 갱신 (DB에서 isProfileComplete=true 반영)
      const refreshRes = await fetch("/api/auth/refresh-session", {
        method: "POST",
      });
      if (!refreshRes.ok) {
        // 쿠키 갱신 실패 시 updateSession 폴백
        try { await updateSession(); } catch { /* ignore */ }
      }
      // 홈으로 이동 (full page reload로 새 JWT 쿠키 적용)
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
          카카오 계정으로 연동되었습니다. 추가 정보를 입력해주세요.
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
        {/* 닉네임 */}
        <div>
          <label className="block text-[13px] font-semibold text-foreground mb-2">
            닉네임 <span className="text-toss-red">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setNicknameAvailable(null); setNicknameError(""); }}
              placeholder="2~12자 (한글, 영문, 숫자, 밑줄)"
              maxLength={12}
              className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
            <button
              onClick={handleCheckNickname}
              disabled={nickname.trim().length < 2 || isCheckingNickname}
              className="h-11 px-4 rounded-xl bg-secondary text-toss-gray-700 dark:text-toss-gray-300 text-[13px] font-semibold disabled:opacity-40 btn-secondary shrink-0"
            >
              {isCheckingNickname ? "확인 중..." : "중복확인"}
            </button>
          </div>
          {nicknameError && (
            <p className="text-[11px] text-toss-red mt-1.5">{nicknameError}</p>
          )}
          {nicknameAvailable === true && (
            <p className="text-[11px] text-toss-green mt-1.5">사용 가능한 닉네임입니다</p>
          )}
        </div>

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

        {/* 서든어택 인증 안내 */}
        <div className="rounded-xl p-4 border border-primary/10 bg-primary/5 dark:bg-primary/10">
          <div className="flex gap-2.5 items-start">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 5v3M8 10h.005" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-primary"/>
            </svg>
            <p className="text-[11px] text-primary leading-relaxed">
              가입 후 서든어택 계정을 인증하면 프로필에 인증 마크가 표시되고, 서든어택 닉네임으로 자동 설정됩니다. 프로필에서 언제든 인증할 수 있습니다.
            </p>
          </div>
        </div>

        {submitError && (
          <p className="text-[12px] text-toss-red text-center">{submitError}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
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
