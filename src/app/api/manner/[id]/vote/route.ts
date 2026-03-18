import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireVerified } from "@/lib/require-verified";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const verifyErr = await requireVerified(session.user.id);
  if (verifyErr) return NextResponse.json({ error: verifyErr }, { status: 403 });

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

  const report = await prisma.mannerTag.findUnique({
    where: { id },
    select: { reporterId: true },
  });
  if (!report) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }

  if (report.reporterId === session.user.id) {
    return NextResponse.json({ error: "본인 글에는 투표할 수 없습니다" }, { status: 403 });
  }

  const existing = await prisma.vote.findUnique({
    where: { mannerTagId_userId: { mannerTagId: id, userId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 투표했습니다" }, { status: 409 });
  }

  await prisma.vote.create({
    data: {
      mannerTagId: id,
      userId: session.user.id,
      voteType,
    },
  });

  return NextResponse.json({ success: true });
}
