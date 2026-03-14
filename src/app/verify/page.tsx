"use client";

import { AuthGuard } from "@/components/common/auth-guard";
import { SaVerificationSection } from "@/components/profile/sa-verification-section";
import Link from "next/link";

export default function VerifyPage() {
  return (
    <AuthGuard>
      <div className="mx-auto max-w-screen-sm px-5 py-8">
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-[13px] text-toss-gray-500 hover:text-foreground transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            프로필로 돌아가기
          </Link>
        </div>
        <SaVerificationSection />
      </div>
    </AuthGuard>
  );
}
