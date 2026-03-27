"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(false);

  if (isLoggedIn) {
    return null;
  }

  function handleKakaoLogin() {
    setLoading(true);
    signIn("kakao", { callbackUrl: "/signup" });
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16 min-h-screen flex flex-col justify-center">
      <div className="text-center mb-10">
        <img src="/icon-192.png" alt="SALog" className="w-14 h-14 rounded-2xl mx-auto mb-4" />
        <h1 className="text-[22px] font-bold text-foreground">SALog에 로그인</h1>
        <p className="text-[13px] text-toss-gray-500 mt-2">
          카카오 계정으로 간편하게 시작하세요
        </p>
      </div>

      <button
        onClick={handleKakaoLogin}
        disabled={loading}
        className="flex items-center justify-center gap-3 w-full h-12 rounded-2xl bg-[#FEE500] text-[#191919] text-[14px] font-medium btn-primary shadow-toss disabled:opacity-60"
      >
        {loading ? (
          <span className="text-[13px]">연동 중...</span>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M9 0.6C4.029 0.6 0 3.713 0 7.55c0 2.486 1.644 4.67 4.117 5.903l-1.05 3.843c-.093.34.297.607.588.403l4.593-3.065c.245.017.493.026.752.026 4.971 0 9-3.113 9-6.95C18 3.713 13.971 0.6 9 0.6z" fill="#191919"/>
            </svg>
            카카오로 계속하기
          </>
        )}
      </button>

      {loading && (
        <p className="text-[12px] text-toss-gray-500 text-center mt-4 animate-pulse">
          카카오 계정으로 로그인 중...
        </p>
      )}

      <button
        onClick={() => { setLoading(true); signIn("kakao", { callbackUrl: "/signup" }, { prompt: "login" }); }}
        disabled={loading}
        className="w-full mt-3 text-[13px] text-toss-gray-400 hover:text-toss-gray-600 transition-colors py-2"
      >
        다른 카카오 계정으로 로그인
      </button>

      <p className="text-[11px] text-toss-gray-400 text-center mt-6 leading-relaxed">
        로그인 시 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
        <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의하게 됩니다.
      </p>
    </div>
  );
}
