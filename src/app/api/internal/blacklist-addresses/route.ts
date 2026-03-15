import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY ?? "";

export async function GET(req: NextRequest) {
  if (!INTERNAL_KEY || req.headers.get("x-internal-key") !== INTERNAL_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 모든 블랙리스트의 고유 병영주소 + 마지막 닉네임 (CrawlStatus에서)
  const entries = await prisma.blacklistEntry.findMany({
    select: { barracksAddress: true },
  });

  // 중복 제거
  const uniqueAddresses = [...new Set(entries.map((e) => e.barracksAddress))];

  // CrawlStatus에서 마지막 닉네임 조회
  const crawlStatuses = await prisma.crawlStatus.findMany({
    where: { barracksAddress: { in: uniqueAddresses } },
    select: { barracksAddress: true, lastNickname: true },
  });

  const nicknameMap = new Map(crawlStatuses.map((c) => [c.barracksAddress, c.lastNickname]));

  const addresses = uniqueAddresses.map((addr) => ({
    barracksAddress: addr,
    lastNickname: nicknameMap.get(addr) ?? null,
  }));

  return NextResponse.json({ addresses });
}
