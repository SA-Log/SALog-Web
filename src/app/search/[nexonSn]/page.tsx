"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BarracksUserPage({ params }: { params: Promise<{ nexonSn: string }> }) {
  const { nexonSn } = use(params);
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    async function resolve() {
      try {
        // 크롤링 서버에서 닉네임 조회
        const res = await fetch(`/api/barracks/profile?nexonSn=${nexonSn}`);
        const data = await res.json();

        if (data.found && data.nickname) {
          // 넥슨 Open API에서 ouid 조회
          const searchRes = await fetch(`/api/sa/search?q=${encodeURIComponent(data.nickname)}`);
          const searchData = await searchRes.json();

          if (searchData.ouid) {
            // 기존 player 페이지로 이동 (ouid + nexonSn 전달)
            router.replace(`/search/player?ouid=${searchData.ouid}&name=${encodeURIComponent(data.nickname)}&nexonSn=${nexonSn}`);
            return;
          }
        }
        setError(true);
      } catch {
        setError(true);
      }
    }
    resolve();
  }, [nexonSn, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-screen-md px-5 py-16 text-center">
        <p className="text-[15px] text-toss-gray-500 font-medium">유저를 찾을 수 없습니다</p>
        <Link href="/search" className="text-[13px] text-primary mt-4 inline-block">검색으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-md px-5 py-16 text-center">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
        <span className="text-primary text-[14px] font-bold">SA</span>
      </div>
      <p className="text-[13px] text-toss-gray-500">유저 정보를 불러오는 중...</p>
    </div>
  );
}
