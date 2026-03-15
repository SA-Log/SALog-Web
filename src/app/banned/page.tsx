"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { signOut, useSession } from "next-auth/react";

type BanDetail = {
  type: "WARNING" | "TEMP" | "PERMANENT";
  reason: string;
  expiresAt: string | null;
  createdAt: string;
};

const BAN_LABELS: Record<string, string> = {
  WARNING: "경고",
  TEMP: "임시 정지",
  PERMANENT: "영구 정지",
};

export default function BannedPage() {
  const { user } = useAuth();
  const { data: session } = useSession();
  const [ban, setBan] = useState<BanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/ban-info")
      .then((res) => res.json())
      .then((data) => { if (data.ban) setBan(data.ban); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 세션에서 밴 정보 fallback
  const banReason = ban?.reason ?? (session as unknown as Record<string, unknown>)?.banReason as string ?? "";
  const banExpiresAt = ban?.expiresAt ?? (session as unknown as Record<string, unknown>)?.banExpiresAt as string ?? null;
  const banType = ban?.type ?? "PERMANENT";

  return (
    <div className="mx-auto max-w-sm px-5 py-10 min-h-screen flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-toss-red/10 flex items-center justify-center mb-6">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 3.5C8.2 3.5 3.5 8.2 3.5 14S8.2 24.5 14 24.5 24.5 19.8 24.5 14 19.8 3.5 14 3.5Z" stroke="#e03131" strokeWidth="1.8"/>
          <path d="M10 10l8 8M18 10l-8 8" stroke="#e03131" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <h1 className="text-[22px] font-bold text-foreground mb-2">
        계정이 {banType === "PERMANENT" ? "영구 정지" : "정지"}되었습니다
      </h1>

      <p className="text-[13px] text-toss-gray-500 leading-relaxed mb-6">
        SALog 이용약관 위반으로 계정이 정지되었습니다.
        {banType === "TEMP" && " 정지 기간이 끝나면 자동으로 해제됩니다."}
        {banType === "PERMANENT" && " 이의가 있으시면 관리자에게 문의해주세요."}
      </p>

      <div className="w-full rounded-xl p-4 bg-toss-gray-50 dark:bg-secondary border border-border/30 mb-6 text-left space-y-3">
        <div className="flex justify-between text-[12px]">
          <span className="text-toss-gray-500">닉네임</span>
          <span className="font-medium text-foreground">{user?.nickname ?? "-"}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-toss-gray-500">정지 유형</span>
          <span className="font-bold text-toss-red">{BAN_LABELS[banType]}</span>
        </div>
        {banReason && (
          <div className="text-[12px]">
            <span className="text-toss-gray-500 block mb-1">사유</span>
            <p className="font-medium text-foreground bg-toss-gray-100 dark:bg-toss-gray-800 rounded-lg p-2.5 text-[11px] leading-relaxed">{banReason}</p>
          </div>
        )}
        {banType === "TEMP" && banExpiresAt && (
          <div className="flex justify-between text-[12px]">
            <span className="text-toss-gray-500">해제 예정일</span>
            <span className="font-medium text-foreground">
              {new Date(banExpiresAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        )}
        {!loading && ban?.createdAt && (
          <div className="flex justify-between text-[12px]">
            <span className="text-toss-gray-500">정지 일시</span>
            <span className="font-medium text-toss-gray-400">
              {new Date(ban.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        )}
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
