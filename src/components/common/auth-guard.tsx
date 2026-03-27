"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

/**
 * 로그인 필요 페이지를 감싸는 가드 컴포넌트.
 * 미로그인 시 로그인 유도 UI를 표시합니다.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-lg px-5 py-20 text-center">
        <img src="/icon-192.png" alt="SALog" className="w-10 h-10 rounded-xl mx-auto mb-3 animate-pulse" />
        <p className="text-[13px] text-toss-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-screen-sm px-5 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
            <path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-foreground mb-2">로그인이 필요합니다</h2>
        <p className="text-[14px] text-toss-gray-500 mb-6 leading-relaxed">
          이 페이지를 이용하려면 로그인해주세요.<br />
          로그인 후 신고 상세보기, 투표, 댓글, 검색 등<br />
          모든 기능을 이용할 수 있습니다.
        </p>
        <Link
          href="/login"
          className="h-11 rounded-xl bg-primary text-white text-[14px] font-semibold flex items-center justify-center btn-primary max-w-[240px] mx-auto w-full"
        >
          로그인
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
