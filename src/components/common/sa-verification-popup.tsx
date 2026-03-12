"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";

const DISMISS_KEY = "salog_sa_popup_dismissed_until";
const DISMISS_COUNT_KEY = "salog_sa_popup_dismiss_count";

// 점진적 백오프: 1회→3일, 2회→7일, 3회→30일, 4회+→영구
const BACKOFF_DAYS = [3, 7, 30];

export function SaVerificationPopup() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    if (user.barracksVerified) return;

    const dismissCount = Number(localStorage.getItem(DISMISS_COUNT_KEY) || "0");
    if (dismissCount >= 4) return; // 4회 이상 닫으면 더 이상 표시하지 않음

    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    // 약간의 딜레이 후 표시
    const timer = setTimeout(() => setShow(true), 1000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user]);

  function dismiss() {
    const dismissCount = Number(localStorage.getItem(DISMISS_COUNT_KEY) || "0");
    const newCount = dismissCount + 1;
    localStorage.setItem(DISMISS_COUNT_KEY, String(newCount));

    if (newCount >= 4) {
      // 4회 이상: 영구 숨김 (먼 미래 날짜)
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 365 * 24 * 60 * 60 * 1000));
    } else {
      const days = BACKOFF_DAYS[Math.min(newCount - 1, BACKOFF_DAYS.length - 1)];
      localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000));
    }
    setShow(false);
  }

  function handleDismiss() {
    dismiss();
  }

  function handleVerify() {
    dismiss();
    router.push("/profile?verify=true");
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss-md w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
            </svg>
          </div>
          <h2 className="text-[17px] font-bold text-foreground">서든어택 계정을 인증해보세요</h2>
          <p className="text-[12px] text-toss-gray-500 mt-1">인증하면 프로필에 인증 마크가 표시됩니다</p>
        </div>

        {/* Tutorial steps */}
        <div className="px-5 pb-4 space-y-2.5">
          {[
            { step: 1, text: "프로필에서 인증 코드를 발급받습니다" },
            { step: 2, text: "메모장에 코드를 적고, 병영수첩 프로필과 함께 스크린샷을 찍습니다" },
            { step: 3, text: "스크린샷 업로드 후 관리자 승인을 기다립니다" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[11px] font-bold text-primary">{step}</span>
              </div>
              <p className="text-[12px] text-toss-gray-700 dark:text-toss-gray-300 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="mx-5 mb-4 rounded-xl p-3 bg-toss-green/5 dark:bg-toss-green/10 border border-toss-green/10">
          <div className="space-y-1.5 text-[11px] text-toss-green">
            <p>✓ 프로필에 인증 마크 표시</p>
            <p>✓ 서든어택 닉네임으로 자동 설정</p>
            <p>✓ 다른 유저의 신뢰도 향상</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-3">
          <button
            onClick={handleVerify}
            className="w-full h-11 rounded-xl bg-primary text-white text-[13px] font-semibold btn-primary"
          >
            인증하러 가기
          </button>
          <button
            onClick={handleDismiss}
            className="w-full h-10 rounded-xl text-[13px] font-medium text-toss-gray-500 hover:bg-secondary transition-colors"
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
}
