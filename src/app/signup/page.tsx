"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
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

  const [step, setStep] = useState(1);

  // Step 1: Barracks + Nickname + Email
  const [barracksNickInput, setBarracksNickInput] = useState("");
  const [barracksNickname, setBarracksNickname] = useState("");
  const [barracksOuid, setBarracksOuid] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [barracksError, setBarracksError] = useState("");
  const [barracksVerified, setBarracksVerified] = useState(false);
  const [useBarracks, setUseBarracks] = useState(true);

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);

  // Step 2: Complete
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 미로그인 상태면 로그인으로
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  // 넥슨 API로 서든어택 닉네임 검증
  async function handleBarracksLookup() {
    if (barracksNickInput.trim().length < 1) {
      setBarracksError("서든어택 닉네임을 입력해주세요");
      return;
    }
    setIsLookingUp(true);
    setBarracksError("");
    try {
      const res = await fetch("/api/barracks/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: barracksNickInput.trim() }),
      });
      const data = await res.json();
      if (data.found && data.nickname) {
        setBarracksNickname(data.nickname);
        setBarracksOuid(data.ouid);
        setBarracksVerified(true);
        setNickname(data.nickname);
      } else {
        setBarracksError(data.error || "닉네임을 찾을 수 없습니다");
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

  const canSubmit = useBarracks
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
          phone: "",
          barracksAddress: useBarracks && barracksOuid ? `https://barracks.sa.nexon.com/${barracksOuid}` : "",
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
      // 세션 갱신 후 풀 리로드로 홈 이동 (미들웨어가 새 JWT를 읽도록)
      await updateSession();
      window.location.replace("/");
      return;
    } catch {
      setSubmitError("서버 연결에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayNickname = useBarracks ? barracksNickname : nickname;

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
        <h1 className="text-[22px] font-bold text-foreground">
          {step === 2 ? "가입 완료!" : "회원가입"}
        </h1>
        {step === 1 && (
          <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400 mt-2">
            카카오 계정으로 연동되었습니다. 추가 정보를 입력해주세요.
          </p>
        )}
      </div>

      {/* 소셜 연동 완료 배너 */}
      {step === 1 && session?.user && (
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

      {/* Step 1: Barracks + Nickname + Email */}
      {step === 1 && (
        <div className="space-y-5">
          {/* 병영주소 연동 선택 */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              서든어택 계정 연동 <span className="text-[11px] font-normal text-toss-gray-500">(선택)</span>
            </label>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setUseBarracks(true); setNickname(""); setNicknameAvailable(null); setNicknameError(""); }}
                className={`flex-1 h-10 rounded-xl text-[13px] font-medium transition-toss ${
                  useBarracks
                    ? "bg-primary text-white"
                    : "bg-secondary text-toss-gray-600 border border-border"
                }`}
              >
                서든어택 연동
              </button>
              <button
                onClick={() => { setUseBarracks(false); setBarracksNickInput(""); setBarracksNickname(""); setBarracksOuid(""); setBarracksVerified(false); setBarracksError(""); }}
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barracksNickInput}
                    onChange={(e) => { setBarracksNickInput(e.target.value); setBarracksVerified(false); setBarracksNickname(""); setBarracksOuid(""); setBarracksError(""); }}
                    placeholder="서든어택 닉네임 입력"
                    disabled={barracksVerified}
                    className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                  <button
                    onClick={handleBarracksLookup}
                    disabled={!barracksNickInput.trim() || isLookingUp || barracksVerified}
                    className="h-11 px-4 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-40 btn-primary shrink-0"
                  >
                    {isLookingUp ? "조회 중..." : "조회"}
                  </button>
                </div>
                {barracksError && (
                  <p className="text-[11px] text-toss-red mt-1.5">{barracksError}</p>
                )}

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
                        <p className="text-[11px] text-toss-gray-500">넥슨 API에서 확인되었습니다</p>
                      </div>
                    </div>
                  </div>
                )}

                {!barracksVerified && (
                  <div className="mt-2 rounded-xl p-3 bg-primary/5 dark:bg-primary/10 border border-primary/10">
                    <p className="text-[11px] text-primary leading-relaxed">
                      서든어택 닉네임을 연동하면 프로필에 인증 마크가 표시되고, SALog 닉네임으로 자동 설정됩니다.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
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

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full h-12 rounded-xl bg-primary text-white text-[14px] font-semibold disabled:opacity-40 btn-primary"
          >
            {isSubmitting ? "가입 중..." : "가입 완료"}
          </button>
        </div>
      )}

      {/* Step 2: Complete */}
      {step === 2 && (
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

          <button
            onClick={() => window.location.href = "/"}
            className="inline-flex h-12 items-center justify-center w-full rounded-xl bg-primary text-white text-[14px] font-semibold btn-primary"
          >
            SALog 시작하기
          </button>
        </div>
      )}

      {/* Terms */}
      {step === 1 && (
        <p className="text-[11px] text-toss-gray-500 dark:text-toss-gray-400 text-center mt-8 leading-relaxed">
          가입 시 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의하게 됩니다.
        </p>
      )}
    </div>
  );
}
