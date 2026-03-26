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

  const rl = rateLimit(`comment:${session.user.id}`, { limit: 20, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  const { id } = await params;
  const body = await req.json();
  const content = body.content?.trim();

  if (!content || content.length > 500) {
    return NextResponse.json({ error: "댓글 내용을 확인해주세요 (최대 500자)" }, { status: 400 });
  }

  const report = await prisma.mannerTag.findUnique({ where: { id }, select: { id: true } });
  if (!report) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      mannerTagId: id,
      userId: session.user.id,
      content,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { id: true, nickname: true, image: true } },
    },
  });

  const { grantExp, EXP_TABLE } = await import("@/lib/exp");
  grantExp(session.user.id, EXP_TABLE.comment).catch(() => {});

  return NextResponse.json(comment, { status: 201 });
}
