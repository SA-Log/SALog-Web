import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY ?? "";

export async function POST(req: NextRequest) {
  if (!INTERNAL_KEY || req.headers.get("x-internal-key") !== INTERNAL_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { barracksAddress, oldNickname, newNickname } = await req.json();

  if (!barracksAddress || !oldNickname || !newNickname) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // CrawlStatus 업데이트
  await prisma.crawlStatus.upsert({
    where: { barracksAddress },
    update: { lastNickname: newNickname, lastCrawledAt: new Date() },
    create: { barracksAddress, lastNickname: newNickname, lastCrawledAt: new Date() },
  });

  // 해당 병영주소의 모든 HackReport에 닉네임 변경 이력 추가
  const reports = await prisma.hackReport.findMany({
    where: { barracksAddress },
    select: { id: true },
  });

  for (const report of reports) {
    await prisma.nicknameHistory.create({
      data: {
        hackReportId: report.id,
        oldNickname,
        newNickname,
      },
    });

    // 게시글 닉네임도 최신으로 업데이트
    await prisma.hackReport.update({
      where: { id: report.id },
      data: { nickname: newNickname },
    });
  }

  // 비매너 신고도 닉네임 업데이트
  await prisma.mannerTag.updateMany({
    where: { barracksAddress },
    data: { nickname: newNickname },
  });

  return NextResponse.json({ success: true, updatedReports: reports.length });
}
