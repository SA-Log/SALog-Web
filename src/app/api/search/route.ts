import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const CRAWLER_URL = process.env.CRAWLER_URL ?? "http://localhost:3001";
const CRAWLER_API_KEY = process.env.CRAWLER_API_KEY ?? "";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  const type = req.nextUrl.searchParams.get("type") ?? "all"; // "all" | "barracks"

  if (!query || query.length < 1) {
    return NextResponse.json({ salogUsers: [], barracksUsers: [], hackReports: [], mannerReports: [] });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`search:${ip}`, { limit: 20, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  // 병영주소 감지 (URL 또는 type=barracks일 때 숫자도 허용)
  const barracksMatch = query.match(/barracks\.sa\.nexon\.com\/(\d+)/);
  const nexonSn = barracksMatch ? barracksMatch[1] : (type === "barracks" && /^\d+$/.test(query) ? query : null);

  const results: {
    salogUsers: unknown[];
    barracksUsers: unknown[];
    hackReports: unknown[];
    mannerReports: unknown[];
  } = { salogUsers: [], barracksUsers: [], hackReports: [], mannerReports: [] };

  // 1. SALog 유저 검색 (닉네임)
  if (!nexonSn) {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        nickname: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        nickname: true,
        image: true,
        barracksVerified: true,
        barracksAddress: true,
        role: true,
      },
      take: 50,
    });

    // 정확히 일치하는 유저를 상위로, 나머지는 가나다순
    results.salogUsers = users.sort((a, b) => {
      const aExact = a.nickname?.toLowerCase() === query.toLowerCase() ? 0 : 1;
      const bExact = b.nickname?.toLowerCase() === query.toLowerCase() ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return (a.nickname ?? "").localeCompare(b.nickname ?? "", "ko");
    });
  }

  // 2. 병영수첩 크롤링 검색
  try {
    if (nexonSn) {
      // 병영주소로 프로필 조회
      const res = await fetch(`${CRAWLER_URL}/api/barracks/profile?nexonSn=${nexonSn}`, {
        headers: { "x-api-key": CRAWLER_API_KEY },
      });
      const data = await res.json();
      if (data.found) {
        results.barracksUsers = [{
          nickname: data.nickname,
          nexonSn: data.nexonSn,
          userImg: data.userImg,
          level: data.level,
          clanName: data.clanName,
        }];
      }
    } else {
      // 닉네임으로 검색
      const res = await fetch(`${CRAWLER_URL}/api/barracks/search?nickname=${encodeURIComponent(query)}`, {
        headers: { "x-api-key": CRAWLER_API_KEY },
      });
      const data = await res.json();
      if (data.found && data.results) {
        // 정확히 일치하는 유저 상위
        results.barracksUsers = data.results.sort((a: { nickname: string }, b: { nickname: string }) => {
          const aExact = a.nickname.toLowerCase() === query.toLowerCase() ? 0 : 1;
          const bExact = b.nickname.toLowerCase() === query.toLowerCase() ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;
          return a.nickname.localeCompare(b.nickname, "ko");
        });
      }
    }
  } catch {
    // 크롤링 실패해도 SALog 결과는 반환
  }

  // 3. 핵 신고 내역 (닉네임 또는 병영주소)
  const hackWhere = nexonSn
    ? { barracksAddress: nexonSn }
    : { nickname: { contains: query, mode: "insensitive" as const } };

  results.hackReports = await prisma.hackReport.findMany({
    where: hackWhere,
    select: {
      id: true,
      nickname: true,
      status: true,
      hackTypes: true,
      createdAt: true,
      barracksAddress: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // 4. 비매너 신고 내역
  const mannerWhere = nexonSn
    ? { barracksAddress: nexonSn }
    : { nickname: { contains: query, mode: "insensitive" as const } };

  results.mannerReports = await prisma.mannerTag.findMany({
    where: mannerWhere,
    select: {
      id: true,
      nickname: true,
      tagType: true,
      tagTypes: true,
      status: true,
      createdAt: true,
      barracksAddress: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json(results);
}
