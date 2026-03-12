import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-screen-lg px-5 py-8">
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">SA</span>
              </div>
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
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-[12px] text-toss-gray-600 dark:text-toss-gray-500">
            &copy; {new Date().getFullYear()} SALog. 서든어택은 넥슨의 등록 상표입니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
