import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // 미인증 유저 투표 제한
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { barracksVerified: true },
  });
  if (!user?.barracksVerified) {
    return NextResponse.json({ error: "병영수첩 인증 후 투표할 수 있습니다" }, { status: 403 });
  }

  const rl = rateLimit(`vote:${session.user.id}`, { limit: 30, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  const { id } = await params;
  const body = await req.json();
  const voteType = body.voteType;

  if (!["AGREE", "DISAGREE"].includes(voteType)) {
    return NextResponse.json({ error: "올바른 투표 유형이 아닙니다" }, { status: 400 });
  }

  // 게시글 존재 확인
  const report = await prisma.hackReport.findUnique({
    where: { id },
    select: { reporterId: true },
  });
  if (!report) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }

  // 본인 글 투표 불가
  if (report.reporterId === session.user.id) {
    return NextResponse.json({ error: "본인 글에는 투표할 수 없습니다" }, { status: 403 });
  }

  // 이미 투표했는지 확인
  const existing = await prisma.vote.findUnique({
    where: { hackReportId_userId: { hackReportId: id, userId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 투표했습니다" }, { status: 409 });
  }

  await prisma.vote.create({
    data: {
      hackReportId: id,
      userId: session.user.id,
      voteType,
    },
  });

  return NextResponse.json({ success: true });
}
