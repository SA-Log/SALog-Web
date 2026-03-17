"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { LoginPrompt } from "@/components/common/login-prompt";

interface FloatingActionButtonProps {
  href: string;
  label: string;
  color?: "primary" | "red" | "orange";
}

const COLOR_MAP = {
  primary: "bg-primary hover:bg-primary/90",
  red: "bg-toss-red hover:bg-toss-red/90",
  orange: "bg-toss-orange hover:bg-toss-orange/90",
};

export function FloatingActionButton({ href, label, color = "primary" }: FloatingActionButtonProps) {
  const { isLoggedIn } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (!isLoggedIn) {
    return (
      <>
        <button
          onClick={() => setShowLogin(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 h-12 px-5 rounded-2xl text-white font-semibold shadow-lg transition-toss ${COLOR_MAP[color]}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="text-[14px] whitespace-nowrap">{label}</span>
        </button>
        {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  return (
    <Link
      href={href}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 h-12 px-5 rounded-2xl text-white font-semibold shadow-lg transition-toss ${COLOR_MAP[color]}`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="text-[14px] whitespace-nowrap">{label}</span>
    </Link>
  );
}

export function FloatingActionGroup({ items }: { items: FloatingActionButtonProps[] }) {
  const { isLoggedIn } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {items.map((item) =>
          !isLoggedIn ? (
            <button
              key={item.href}
              onClick={() => setShowLogin(true)}
              className={`flex items-center gap-2 h-12 px-5 rounded-2xl text-white font-semibold shadow-lg transition-toss ${COLOR_MAP[item.color ?? "primary"]}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-[13px] whitespace-nowrap">{item.label}</span>
            </button>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 h-12 px-5 rounded-2xl text-white font-semibold shadow-lg transition-toss ${COLOR_MAP[item.color ?? "primary"]}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-[13px] whitespace-nowrap">{item.label}</span>
            </Link>
          )
        )}
      </div>
      {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}
    </>
  );
}
