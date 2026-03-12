"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-secondary" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-9 h-9 rounded-xl bg-secondary btn-ghost flex items-center justify-center overflow-hidden group"
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {/* Sun */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className={`absolute transition-all duration-500 ease-out ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
      >
        <circle cx="12" cy="12" r="4" fill="#f59f00" />
        <g stroke="#f59f00" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
      </svg>

      {/* Moon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className={`absolute transition-all duration-500 ease-out ${
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
      >
        <path
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          fill="#a78bfa"
          stroke="#a78bfa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
