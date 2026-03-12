"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useAuth } from "@/providers/auth-provider";

const KAKAO_ENABLED = !!process.env.NEXT_PUBLIC_KAKAO_ENABLED;
const NAVER_ENABLED = !!process.env.NEXT_PUBLIC_NAVER_ENABLED;

export default function LoginPage() {
  const { isLoggedIn } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // 미들웨어에서 이미 리다이렉트하지만, 클라이언트 side 보호
  if (isLoggedIn) {
    return null;
  }

  function handleSocialLogin(provider: string) {
    setLoadingProvider(provider);
    signIn(provider, { callbackUrl: "/" });
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-lg font-bold">SA</span>
        </div>
        <h1 className="text-[22px] font-bold text-foreground">SALog에 로그인</h1>
        <p className="text-[13px] text-toss-gray-500 mt-2">
          소셜 계정으로 간편하게 시작하세요
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Kakao */}
        <button
          onClick={() => handleSocialLogin("kakao")}
          disabled={!!loadingProvider || !KAKAO_ENABLED}
          className="flex items-center justify-center gap-3 w-full h-12 rounded-2xl bg-[#FEE500] text-[#191919] text-[14px] font-medium btn-primary shadow-toss disabled:opacity-60"
        >
          {loadingProvider === "kakao" ? (
            <span className="text-[13px]">연동 중...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M9 0.6C4.029 0.6 0 3.713 0 7.55c0 2.486 1.644 4.67 4.117 5.903l-1.05 3.843c-.093.34.297.607.588.403l4.593-3.065c.245.017.493.026.752.026 4.971 0 9-3.113 9-6.95C18 3.713 13.971 0.6 9 0.6z" fill="#191919"/>
              </svg>
              {KAKAO_ENABLED ? "카카오로 계속하기" : "카카오 (준비 중)"}
            </>
          )}
        </button>

        {/* Naver */}
        <button
          onClick={() => handleSocialLogin("naver")}
          disabled={!!loadingProvider || !NAVER_ENABLED}
          className="flex items-center justify-center gap-3 w-full h-12 rounded-2xl bg-[#03C75A] text-white text-[14px] font-medium btn-primary shadow-toss disabled:opacity-60"
        >
          {loadingProvider === "naver" ? (
            <span className="text-[13px]">연동 중...</span>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                <path d="M10.85 8.55L4.95 0H0v16h5.15V7.45L11.05 16H16V0h-5.15v8.55z"/>
              </svg>
              {NAVER_ENABLED ? "네이버로 계속하기" : "네이버 (준비 중)"}
            </>
          )}
        </button>

        {/* Google */}
        <button
          onClick={() => handleSocialLogin("google")}
          disabled={!!loadingProvider}
          className="flex items-center justify-center gap-3 w-full h-12 rounded-2xl bg-card border border-border text-[14px] font-medium text-foreground btn-secondary shadow-toss disabled:opacity-60"
        >
          {loadingProvider === "google" ? (
            <span className="text-[13px] text-toss-gray-500">연동 중...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google로 계속하기
            </>
          )}
        </button>
      </div>

      {loadingProvider && (
        <p className="text-[12px] text-toss-gray-500 text-center mt-4 animate-pulse">
          {loadingProvider === "kakao" ? "카카오" : loadingProvider === "naver" ? "네이버" : "Google"} 계정으로 로그인 중...
        </p>
      )}

      <p className="text-[11px] text-toss-gray-400 text-center mt-6 leading-relaxed">
        로그인 시 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
        <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의하게 됩니다.
      </p>
    </div>
  );
}
