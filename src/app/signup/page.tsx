"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SignupPageWrapper() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-sm px-5 py-10 text-center">
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

  const [step, setStep] = useState(1);

  // Step 1: Phone verification
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 2: Barracks + Nickname + Email
  const [barracksUrl, setBarracksUrl] = useState("");
  const [barracksNickname, setBarracksNickname] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [barracksError, setBarracksError] = useState("");
  const [barracksVerified, setBarracksVerified] = useState(false);
  const [useBarracks, setUseBarracks] = useState(true);

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);

  // Step 3: Complete
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 미로그인 상태면 로그인으로
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Timer for verification code
  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current!);
    }
  }, [codeSent]);

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  function handlePhoneChange(value: string) {
    setPhone(formatPhone(value));
    setCodeSent(false);
    setPhoneVerified(false);
    setPhoneError("");
    setCode("");
  }

  const rawPhone = phone.replace(/-/g, "");
  const isPhoneValid = /^01[016789]\d{7,8}$/.test(rawPhone);

  // TODO: SMS 서비스 연동 시 실제 발송으로 교체
  function handleSendCode() {
    if (!isPhoneValid) return;
    setIsSending(true);
    setPhoneError("");
    setTimeout(() => {
      setCodeSent(true);
      setIsSending(false);
      setTimer(180);
    }, 1000);
  }

  // TODO: SMS 서비스 연동 시 실제 검증으로 교체
  function handleVerifyCode() {
    if (code.length !== 6) return;
    setIsVerifying(true);
    setPhoneError("");
    setTimeout(() => {
      if (code === "123456") {
        setPhoneVerified(true);
        setPhoneError("");
        clearInterval(timerRef.current!);
      } else {
        setPhoneError("인증번호가 올바르지 않습니다");
      }
      setIsVerifying(false);
    }, 800);
  }

  // 병영주소 조회 — 실제 크롤링 API 호출
  async function handleBarracksLookup() {
    const pattern = /^https?:\/\/barracks\.sa\.nexon\.com\/\d+/;
    if (!pattern.test(barracksUrl.trim())) {
      setBarracksError("올바른 병영주소 URL 형식이 아닙니다");
      return;
    }
    setIsLookingUp(true);
    setBarracksError("");
    try {
      const res = await fetch("/api/barracks/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: barracksUrl.trim() }),
      });
      const data = await res.json();
      if (data.found && data.nickname) {
        setBarracksNickname(data.nickname);
        setBarracksVerified(true);
        setNickname(data.nickname);
      } else {
        setBarracksError(data.error || "닉네임을 가져올 수 없습니다");
      }
    } catch {
      setBarracksError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLookingUp(false);
    }
  }

  // 닉네임 중복확인 — 실제 API 호출
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

  const canProceedStep1 = phoneVerified;

  const canProceedStep2 = useBarracks
    ? barracksVerified
    : (nickname.trim().length >= 2 && nicknameAvailable === true);

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const finalNickname = useBarracks ? barracksNickname : nickname.trim();
      const res = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: finalNickname,
          phone: rawPhone,
          barracksAddress: useBarracks ? barracksUrl.trim() : "",
          barracksVerified: useBarracks && barracksVerified,
          notificationEmail: email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "가입에 실패했습니다");
        setIsSubmitting(false);
        return;
      }
      // 세션 갱신 → JWT에 isProfileComplete=true 반영
      await updateSession();
      setStep(3);
    } catch {
      setSubmitError("서버 연결에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const displayNickname = useBarracks ? barracksNickname : nickname;

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-sm px-5 py-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-lg font-bold">SA</span>
        </div>
        <p className="text-[13px] text-toss-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  const providerName = session?.user?.image ? null : null; // provider info not easily available in session

  return (
    <div className="mx-auto max-w-sm px-5 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-lg font-bold">SA</span>
        </div>
        <h1 className="text-[22px] font-bold text-foreground">
          {step === 3 ? "가입 완료!" : "회원가입"}
        </h1>
        {step < 3 && (
          <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400 mt-2">
            소셜 계정으로 연동되었습니다. 추가 정보를 입력해주세요.
          </p>
        )}
      </div>

      {/* 소셜 연동 완료 배너 */}
      {step < 3 && session?.user && (
        <div className="rounded-xl p-3 border bg-toss-green-light dark:bg-toss-green/10 border-toss-green/20 mb-6 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="9" fill="#30b87e" fillOpacity="0.15"/>
            <path d="M5 9L8 12L13 6" stroke="#30b87e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <p className="text-[12px] font-semibold text-foreground">소셜 계정 연동 완료</p>
            <p className="text-[11px] text-toss-gray-500">{session.user.email ?? "소셜 로그인이 설정되었습니다"}</p>
          </div>
        </div>
      )}

      {/* Progress */}
      {step < 3 && (
        <div className="flex items-center mb-8">
          {[1, 2].map((s) => (
            <div key={s} className={`flex items-center ${s < 2 ? "flex-1" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-toss ${
                step >= s ? "bg-primary text-white" : "bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-400"
              }`}>
                {step > s ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : s}
              </div>
              {s < 2 && <div className={`flex-1 h-0.5 mx-2 rounded-full transition-toss ${step > s ? "bg-primary" : "bg-toss-gray-100 dark:bg-toss-gray-700"}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Phone verification */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              휴대폰 번호 <span className="text-toss-red">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="010-1234-5678"
                disabled={phoneVerified}
                className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 disabled:opacity-50"
              />
              <button
                onClick={handleSendCode}
                disabled={!isPhoneValid || isSending || phoneVerified || (codeSent && timer > 0)}
                className="h-11 px-4 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-40 btn-primary shrink-0"
              >
                {isSending ? "전송 중..." : codeSent ? "재전송" : "인증번호 전송"}
              </button>
            </div>
            <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 mt-1.5">
              본인 확인을 위해 휴대폰 번호를 인증해주세요
            </p>
          </div>

          {/* Verification code input */}
          {codeSent && !phoneVerified && (
            <div>
              <label className="block text-[13px] font-semibold text-foreground mb-2">
                인증번호
                {timer > 0 && (
                  <span className="font-normal text-toss-red ml-2">{formatTimer(timer)}</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setPhoneError(""); }}
                  placeholder="6자리 인증번호"
                  maxLength={6}
                  className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-[14px] text-center tracking-[0.3em] font-mono placeholder:text-toss-gray-400 placeholder:tracking-normal outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                  autoFocus
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={code.length !== 6 || isVerifying}
                  className="h-11 px-5 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-40 btn-primary shrink-0"
                >
                  {isVerifying ? "확인 중..." : "확인"}
                </button>
              </div>
              {phoneError && (
                <p className="text-[11px] text-toss-red mt-1.5">{phoneError}</p>
              )}
              {timer === 0 && (
                <p className="text-[11px] text-toss-red mt-1.5">인증 시간이 만료되었습니다. 재전송해주세요.</p>
              )}
            </div>
          )}

          {/* Phone verified */}
          {phoneVerified && (
            <div className="rounded-xl p-4 border bg-toss-green-light dark:bg-toss-green/10 border-toss-green/20">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#30b87e" fillOpacity="0.15"/>
                  <path d="M6 10L9 13L14 7" stroke="#30b87e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">휴대폰 인증 완료</p>
                  <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-400">{phone}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="w-full h-12 rounded-xl bg-primary text-white text-[14px] font-semibold disabled:opacity-40 btn-primary"
          >
            다음
          </button>
        </div>
      )}

      {/* Step 2: Barracks + Nickname + Email */}
      {step === 2 && (
        <div className="space-y-5">
          {/* 병영주소 연동 선택 */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              병영주소 연동 <span className="text-[11px] font-normal text-toss-gray-500">(선택)</span>
            </label>

            {/* 연동 토글 */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setUseBarracks(true); setNickname(""); setNicknameAvailable(null); setNicknameError(""); }}
                className={`flex-1 h-10 rounded-xl text-[13px] font-medium transition-toss ${
                  useBarracks
                    ? "bg-primary text-white"
                    : "bg-secondary text-toss-gray-600 border border-border"
                }`}
              >
                병영주소 연동
              </button>
              <button
                onClick={() => { setUseBarracks(false); setBarracksUrl(""); setBarracksNickname(""); setBarracksVerified(false); setBarracksError(""); }}
                className={`flex-1 h-10 rounded-xl text-[13px] font-medium transition-toss ${
                  !useBarracks
                    ? "bg-primary text-white"
                    : "bg-secondary text-toss-gray-600 border border-border"
                }`}
              >
                연동 안 함
              </button>
            </div>

            {useBarracks ? (
              <>
                {/* 병영주소 입력 */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={barracksUrl}
                    onChange={(e) => { setBarracksUrl(e.target.value); setBarracksVerified(false); setBarracksNickname(""); setBarracksError(""); }}
                    placeholder="https://barracks.sa.nexon.com/..."
                    disabled={barracksVerified}
                    className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                  <button
                    onClick={handleBarracksLookup}
                    disabled={!barracksUrl.trim() || isLookingUp || barracksVerified}
                    className="h-11 px-4 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-40 btn-primary shrink-0"
                  >
                    {isLookingUp ? "조회 중..." : "조회"}
                  </button>
                </div>
                {barracksError && (
                  <p className="text-[11px] text-toss-red mt-1.5">{barracksError}</p>
                )}

                {/* 조회 성공 */}
                {barracksVerified && (
                  <div className="mt-3 rounded-xl p-4 border bg-toss-green-light dark:bg-toss-green/10 border-toss-green/20">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-toss-green flex items-center justify-center shrink-0">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M3 6.5l2 2 4-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">닉네임: {barracksNickname}</p>
                        <p className="text-[11px] text-toss-gray-500">병영수첩에서 자동으로 가져왔습니다</p>
                      </div>
                    </div>
                  </div>
                )}

                {!barracksVerified && (
                  <div className="mt-2 rounded-xl p-3 bg-primary/5 dark:bg-primary/10 border border-primary/10">
                    <p className="text-[11px] text-primary leading-relaxed">
                      병영주소를 연동하면 프로필에 인증 마크가 표시되고, 닉네임이 자동으로 설정됩니다.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* 닉네임 직접 입력 */}
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

                {/* 병영주소 미연동 안내 */}
                <div className="mt-2 rounded-xl p-4 border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10">
                  <div className="flex gap-2.5 items-start">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
                      <path d="M8 1L14.93 13H1.07L8 1Z" stroke="#f59f00" strokeWidth="1.2" strokeLinejoin="round"/>
                      <path d="M8 6V9M8 11V11.5" stroke="#f59f00" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <p className="text-[12px] text-amber-600 dark:text-amber-400 font-semibold mb-1">병영주소 미연동 시 안내</p>
                      <ul className="text-[11px] text-amber-600/80 dark:text-amber-400/80 space-y-0.5 list-disc list-inside">
                        <li>프로필에 인증 마크가 표시되지 않습니다</li>
                        <li>다른 유저가 신뢰도를 낮게 평가할 수 있습니다</li>
                        <li>닉네임 변경이 불가능합니다</li>
                        <li>가입 후에도 프로필에서 병영주소를 연동할 수 있습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Email */}
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
            <div className="rounded-xl p-4 border border-toss-orange/20 bg-toss-orange-light dark:bg-toss-orange/10 mt-2">
              <div className="flex gap-2 items-start">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
                  <path d="M8 1L14.93 13H1.07L8 1Z" stroke="#f59f00" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M8 6V9M8 11V11.5" stroke="#f59f00" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <div>
                  <p className="text-[12px] text-toss-orange font-semibold mb-1">이메일 미등록 시 아래 기능을 이용할 수 없습니다</p>
                  <ul className="text-[11px] text-toss-orange/80 space-y-0.5 list-disc list-inside">
                    <li>블랙리스트 유저의 닉네임 변경 알림</li>
                    <li>내 신고 건의 상태 변경 알림</li>
                    <li>주요 공지사항 및 업데이트 소식</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {submitError && (
            <p className="text-[12px] text-toss-red text-center">{submitError}</p>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep(1)}
              className="flex-1 h-12 rounded-xl bg-secondary text-toss-gray-700 dark:text-toss-gray-300 text-[14px] font-semibold btn-secondary">
              이전
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canProceedStep2 || isSubmitting}
              className="flex-1 h-12 rounded-xl bg-primary text-white text-[14px] font-semibold disabled:opacity-40 btn-primary"
            >
              {isSubmitting ? "가입 중..." : "가입 완료"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 3 && (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-toss-green/10 flex items-center justify-center mx-auto">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M10 20L17 27L30 13" stroke="#30b87e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div>
            <p className="text-[18px] font-bold text-foreground mb-1">환영합니다, {displayNickname}님!</p>
            <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400">
              SALog 가입이 완료되었습니다
            </p>
          </div>

          <div className="bg-secondary rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-toss-gray-500 dark:text-toss-gray-400">닉네임</span>
              <span className="font-semibold text-foreground">{displayNickname}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-toss-gray-500 dark:text-toss-gray-400">병영주소</span>
              <span className={`font-semibold ${barracksVerified ? "text-toss-green" : "text-toss-gray-400"}`}>
                {barracksVerified ? "연동됨" : "미연동"}
              </span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-toss-gray-500 dark:text-toss-gray-400">계급</span>
              <span className="font-semibold text-foreground">훈련병</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-toss-gray-500 dark:text-toss-gray-400">이메일 알림</span>
              <span className={`font-semibold ${email ? "text-toss-green" : "text-toss-gray-400"}`}>
                {email ? "활성" : "미설정"}
              </span>
            </div>
          </div>

          {barracksVerified && (
            <div className="rounded-xl p-3 bg-toss-green-light dark:bg-toss-green/10 border border-toss-green/20 flex items-center gap-2.5 justify-center">
              <div className="w-4 h-4 rounded-full bg-toss-green flex items-center justify-center shrink-0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2.5 5.5l1.5 1.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[12px] text-toss-green font-semibold">병영수첩 인증 완료 — 프로필에 인증 마크가 표시됩니다</p>
            </div>
          )}

          {!barracksVerified && (
            <div className="rounded-xl p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
              <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                프로필 설정에서 언제든 병영주소를 연동하여 인증 마크를 받을 수 있습니다
              </p>
            </div>
          )}

          {!email && (
            <div className="rounded-xl p-3 bg-toss-orange-light dark:bg-toss-orange/10 border border-toss-orange/20">
              <p className="text-[11px] text-toss-orange leading-relaxed">
                프로필 설정에서 언제든 이메일을 등록할 수 있습니다
              </p>
            </div>
          )}

          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center w-full rounded-xl bg-primary text-white text-[14px] font-semibold btn-primary"
          >
            SALog 시작하기
          </Link>
        </div>
      )}

      {/* Terms */}
      {step < 3 && (
        <p className="text-[11px] text-toss-gray-500 dark:text-toss-gray-400 text-center mt-8 leading-relaxed">
          가입 시 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의하게 됩니다.
        </p>
      )}
    </div>
  );
}
