"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useAuth } from "@/providers/auth-provider";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoggedIn, isLoading } = useAuth();

  const isAdmin = isLoggedIn && user && (
    user.role === "MASTER" || user.role === "VICE_MASTER" || user.role === "OPERATOR"
  );

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
          <ThemeToggle />

          {/* Auth-aware right section */}
          {!isLoading && (
            isLoggedIn && user ? (
              <Link
                href="/profile"
                className={`hidden sm:flex w-8 h-8 rounded-lg items-center justify-center shrink-0 btn-ghost ${
                  pathname.startsWith("/profile")
                    ? "bg-primary/10 ring-2 ring-primary/30"
                    : "bg-secondary"
                }`}
              >
                <span className="text-[11px] font-bold text-primary">{displayChar}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex h-8 px-3 rounded-lg items-center text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-toss"
              >
                로그인
              </Link>
            )
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
            {isLoggedIn && user ? (
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 py-2.5 text-[14px] font-medium ${
                  pathname.startsWith("/profile") ? "text-primary" : "text-toss-gray-600"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center">
                  <span className="text-[9px] font-bold text-primary">{displayChar}</span>
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
        </div>
      )}
    </header>
  );
}
