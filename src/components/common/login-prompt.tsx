"use client";

import { useRouter } from "next/navigation";

export function LoginPrompt({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss-md w-full max-w-xs overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" className="text-primary"/>
            <path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
          </svg>
        </div>
        <h2 className="text-[17px] font-bold text-foreground mb-1">로그인이 필요합니다</h2>
        <p className="text-[13px] text-toss-gray-500 mb-6">이 기능을 이용하려면 로그인해주세요.</p>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-secondary text-[14px] font-semibold text-toss-gray-600 transition-all active:scale-[0.98]"
          >
            나중에 할게요
          </button>
          <button
            onClick={() => router.push("/login")}
            className="flex-1 h-11 rounded-xl bg-primary text-white text-[14px] font-semibold transition-all active:scale-[0.98]"
          >
            지금 할게요
          </button>
        </div>
      </div>
    </div>
  );
}
