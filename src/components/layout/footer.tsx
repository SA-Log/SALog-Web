import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-screen-lg px-5 py-8">
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/icon-192.png" alt="SALog" className="w-6 h-6 rounded-md" />
              <span className="font-bold text-foreground text-sm">SALog</span>
            </div>
            <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 leading-relaxed max-w-xs">
              커뮤니티 기반 정보 공유 플랫폼이며,<br />
              등록된 정보의 정확성을 보장하지 않습니다.
            </p>
          </div>
          <div className="flex gap-10 text-[13px]">
            <div className="flex flex-col gap-2.5">
              <span className="font-semibold text-foreground mb-0.5">서비스</span>
              <Link href="/reports" className="text-toss-gray-600 dark:text-toss-gray-500 hover:text-foreground transition-toss">핵 유저 신고 게시판</Link>
              <Link href="/manner" className="text-toss-gray-600 dark:text-toss-gray-500 hover:text-foreground transition-toss">비매너 유저 게시판</Link>
              <Link href="/search" className="text-toss-gray-600 dark:text-toss-gray-500 hover:text-foreground transition-toss">검색</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-semibold text-foreground mb-0.5">안내</span>
              <Link href="/policy" className="text-toss-gray-600 dark:text-toss-gray-500 hover:text-foreground transition-toss">운영 정책</Link>
              <Link href="/privacy" className="text-toss-gray-600 dark:text-toss-gray-500 hover:text-foreground transition-toss">개인정보처리방침</Link>
              <Link href="/terms" className="text-toss-gray-600 dark:text-toss-gray-500 hover:text-foreground transition-toss">이용약관</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-semibold text-foreground mb-0.5">커뮤니티</span>
              <a href="https://discord.gg/tFsa42C5uP" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-toss-gray-600 dark:text-toss-gray-500 hover:text-foreground transition-toss">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                디스코드
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-500">
            &copy; {new Date().getFullYear()} SALog. 서든어택은 넥슨의 등록 상표입니다.
          </p>
          <p className="text-[11px] text-toss-gray-500 dark:text-toss-gray-600 mt-1">
            Data based on NEXON Open API. This service is not affiliated with or endorsed by NEXON.
          </p>
        </div>
      </div>
    </footer>
  );
}
