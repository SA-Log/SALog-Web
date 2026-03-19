import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNicknameChange } from "@/lib/discord";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY ?? "";

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-internal-key");
  if (!INTERNAL_KEY || key !== INTERNAL_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { barracksAddress, oldNickname, newNickname } = await req.json();
  if (!barracksAddress || !oldNickname || !newNickname) {
    return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
  }

  // 1. NicknameHistory 생성
  await prisma.nicknameHistory.create({
    data: { barracksAddress, oldNickname, newNickname },
  });

  // 2. CrawlStatus 업데이트 (lastNickname 갱신)
  await prisma.crawlStatus.upsert({
    where: { barracksAddress },
    update: { lastNickname: newNickname, lastCrawledAt: new Date() },
    create: { barracksAddress, lastNickname: newNickname },
  });

  // 3. 해당 병영주소의 핵 신고/비매너 닉네임 일괄 업데이트
  await Promise.all([
    prisma.hackReport.updateMany({
      where: { barracksAddress, nickname: oldNickname },
      data: { nickname: newNickname },
    }),
    prisma.mannerTag.updateMany({
      where: { barracksAddress, nickname: oldNickname },
      data: { nickname: newNickname },
    }),
  ]);

  // 4. SALog 디스코드 알림
  notifyNicknameChange({ oldNickname, newNickname, barracksAddress }).catch(() => {});

  return NextResponse.json({ success: true });
}
