"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/providers/auth-provider";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoggedIn, isLoading, logout } = useAuth();

  const isAdmin = isLoggedIn && user && (
    user.role === "MASTER" || user.role === "VICE_MASTER" || user.role === "OPERATOR"
  );
  const isCreator = isLoggedIn && user?.role === "VERIFIED_CREATOR";

  const navItems = [
    { href: "/reports", label: "핵 유저" },
    { href: "/manner", label: "비매너" },
    { href: "/ranking", label: "랭킹" },
    { href: "/search", label: "검색" },
    ...(isAdmin ? [{ href: "/admin", label: "관리자" }] : []),
  ];

  const displayChar = user?.nickname?.charAt(0) ?? user?.name?.charAt(0) ?? "?";

  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="mx-auto max-w-screen-lg flex h-14 items-center px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-4 sm:mr-8">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">SA</span>
          </div>
          <span className="font-bold text-foreground text-[15px]">SALog</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-toss ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-toss-gray-700 dark:text-toss-gray-500 hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* 크리에이터 신청 (데스크탑) */}
          {isLoggedIn && !isCreator && (
            <Link
              href="/creator/apply"
              className="hidden sm:flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.97] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1l1.76 3.57L12.8 5.2l-2.9 2.83.68 3.97L7 10.17 3.42 12l.68-3.97L1.2 5.2l4.04-.63L7 1z" fill="currentColor" opacity="0.9"/>
              </svg>
              크리에이터
            </Link>
          )}

          {/* Desktop: Auth button — 로딩 시 스켈레톤 표시 */}
          {isLoading ? (
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-secondary animate-pulse" />
          ) : isLoggedIn && user ? (
            <Link
              href="/profile"
              className={`hidden sm:flex w-8 h-8 rounded-full items-center justify-center shrink-0 transition-all overflow-hidden ${
                pathname.startsWith("/profile")
                  ? "ring-2 ring-primary/30"
                  : "ring-1 ring-border/40 hover:ring-primary/20"
              }`}
            >
              {user.image ? (
                <img src={user.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-primary bg-secondary w-full h-full flex items-center justify-center">{displayChar}</span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex h-8 px-3 rounded-lg items-center text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-toss"
            >
              로그인
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 rounded-lg btn-ghost"
            aria-label="메뉴"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              {mobileOpen ? (
                <path d="M4.5 4.5L13.5 13.5M4.5 13.5L13.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M3 5.25H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3 9H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3 12.75H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-card px-5 pb-4 pt-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-2.5 text-[14px] font-medium transition-toss ${
                  isActive ? "text-primary" : "text-toss-gray-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="mt-2 pt-2 border-t border-border">
            {isLoading ? (
              <div className="flex items-center gap-2.5 py-2.5">
                <div className="w-6 h-6 rounded-md bg-secondary animate-pulse" />
                <div className="w-16 h-4 rounded bg-secondary animate-pulse" />
              </div>
            ) : isLoggedIn && user ? (
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 py-2.5 text-[14px] font-medium ${
                  pathname.startsWith("/profile") ? "text-primary" : "text-toss-gray-600"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold text-primary">{displayChar}</span>
                  )}
                </div>
                내 프로필
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-[14px] font-medium text-primary"
              >
                로그인
              </Link>
            )}
          </div>
          {/* 크리에이터 신청 + 로그아웃 (모바일) */}
          {isLoggedIn && (
            <div className="pt-2 border-t border-border flex items-center justify-between">
              {!isCreator ? (
                <Link
                  href="/creator/apply"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 -ml-1 rounded-full text-[12px] font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1l1.76 3.57L12.8 5.2l-2.9 2.83.68 3.97L7 10.17 3.42 12l.68-3.97L1.2 5.2l4.04-.63L7 1z" fill="currentColor" opacity="0.9"/>
                  </svg>
                  크리에이터 신청
                </Link>
              ) : <span />}
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="py-2.5 text-[13px] font-medium text-toss-gray-400 hover:text-toss-gray-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
