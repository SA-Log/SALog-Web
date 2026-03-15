"use client";

import { useAuth } from "@/providers/auth-provider";
import { signOut } from "next-auth/react";

export default function BannedPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-sm px-5 py-10 min-h-screen flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-toss-red/10 flex items-center justify-center mb-6">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 3.5C8.2 3.5 3.5 8.2 3.5 14S8.2 24.5 14 24.5 24.5 19.8 24.5 14 19.8 3.5 14 3.5Z" stroke="#e03131" strokeWidth="1.8"/>
          <path d="M10 10l8 8M18 10l-8 8" stroke="#e03131" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <h1 className="text-[22px] font-bold text-foreground mb-2">계정이 정지되었습니다</h1>

      <p className="text-[13px] text-toss-gray-500 leading-relaxed mb-6">
        SALog 이용약관 위반으로 계정이 정지되었습니다.
        이의가 있으시면 관리자에게 문의해주세요.
      </p>

      <div className="w-full rounded-xl p-4 bg-toss-gray-50 dark:bg-secondary border border-border/30 mb-6 text-left space-y-2">
        <div className="flex justify-between text-[12px]">
          <span className="text-toss-gray-500">닉네임</span>
          <span className="font-medium text-foreground">{user?.nickname ?? "-"}</span>
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full h-11 rounded-xl bg-secondary text-[14px] font-semibold text-toss-gray-600 transition-all hover:bg-secondary/80"
      >
        로그아웃
      </button>
    </div>
  );
}
