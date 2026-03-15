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

  const rl = rateLimit(`manner-detail:${session.user.id}`, { limit: 30, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  if (!id || typeof id !== "string" || id.length > 50) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const report = await prisma.mannerTag.findUnique({
    where: { id },
    select: {
      id: true,
      nickname: true,
      barracksAddress: true,
      tagType: true,
      tagTypes: true,
      description: true,
      reporterId: true,
      createdAt: true,
      reporter: {
        select: { id: true, nickname: true, image: true },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;
  const report = await prisma.mannerTag.findUnique({
    where: { id },
    select: { reporterId: true },
  });

  if (!report) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }
  if (report.reporterId !== session.user.id) {
    return NextResponse.json({ error: "본인 글만 삭제할 수 있습니다" }, { status: 403 });
  }

  await prisma.mannerTag.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;
  const report = await prisma.mannerTag.findUnique({
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
  if (body.tagTypes !== undefined) {
    updateData.tagTypes = body.tagTypes;
    updateData.tagType = body.tagTypes[0];
  }

  await prisma.mannerTag.update({ where: { id }, data: updateData });
  return NextResponse.json({ success: true });
}
