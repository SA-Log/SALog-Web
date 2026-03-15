import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`report-detail:${session.user.id}`, {
    limit: 30,
    windowSec: 60,
  });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;

  if (!id || typeof id !== "string" || id.length > 50) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const report = await prisma.hackReport.findUnique({
    where: { id },
    include: {
      reporter: {
        select: {
          id: true,
          nickname: true,
          image: true,
        },
      },
      votes: {
        select: {
          id: true,
          voteType: true,
          userId: true,
        },
      },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              nickname: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      nicknameHistory: {
        select: {
          id: true,
          oldNickname: true,
          newNickname: true,
          detectedAt: true,
        },
        orderBy: { detectedAt: "desc" },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const agreeCount = report.votes.filter((v) => v.voteType === "AGREE").length;
  const disagreeCount = report.votes.filter((v) => v.voteType === "DISAGREE").length;
  const unsureCount = report.votes.length - agreeCount - disagreeCount;
  const userVote = report.votes.find((v) => v.userId === session.user!.id);

  return NextResponse.json({
    id: report.id,
    nickname: report.nickname,
    barracksAddress: report.barracksAddress,
    status: report.status,
    hackTypes: report.hackTypes,
    description: report.description,
    evidences: report.evidences,
    youtubeUrl: report.youtubeUrl,
    createdAt: report.createdAt,
    reporter: report.reporter,
    reporterId: report.reporterId,
    agreeCount,
    unsureCount,
    disagreeCount,
    userVote: userVote?.voteType ?? null,
    comments: report.comments,
    nicknameHistory: report.nicknameHistory,
  });
}

// 삭제
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;
  const report = await prisma.hackReport.findUnique({
    where: { id },
    select: { reporterId: true },
  });

  if (!report) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }
  if (report.reporterId !== session.user.id) {
    return NextResponse.json({ error: "본인 글만 삭제할 수 있습니다" }, { status: 403 });
  }

  // Cascade로 투표, 댓글, 닉네임이력 자동 삭제
  await prisma.hackReport.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

// 수정
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;
  const report = await prisma.hackReport.findUnique({
    where: { id },
    select: { reporterId: true },
  });

  if (!report) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }
  if (report.reporterId !== session.user.id) {
    return NextResponse.json({ error: "본인 글만 수정할 수 있습니다" }, { status: 403 });
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {};
  if (body.description !== undefined) updateData.description = body.description?.trim() || null;
  if (body.hackTypes !== undefined) updateData.hackTypes = body.hackTypes;

  const updated = await prisma.hackReport.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true, id: updated.id });
}
