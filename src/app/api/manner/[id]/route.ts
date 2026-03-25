import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id ?? "anon";

  const rl = rateLimit(`manner-detail:${userId}`, { limit: 30, windowSec: 60 });
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
      evidences: true,
      status: true,
      adminNote: true,
      reporterId: true,
      createdAt: true,
      reporter: {
        select: { id: true, nickname: true, image: true, barracksVerified: true },
      },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { id: true, nickname: true, image: true, barracksVerified: true } },
        },
        orderBy: { createdAt: "asc" as const },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blacklisted = session?.user?.id && report.barracksAddress
    ? !!(await prisma.blacklistEntry.findUnique({
        where: { userId_barracksAddress: { userId: session.user.id, barracksAddress: report.barracksAddress } },
      }))
    : false;

  const adminHistory = await prisma.adminLog.findMany({
    where: { targetType: "mannerTag", targetId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      detail: true,
      createdAt: true,
      actor: { select: { nickname: true, role: true } },
    },
  });

  return NextResponse.json({ ...report, adminHistory, blacklisted });
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
  if (body.description !== undefined) updateData.description = (body.description?.trim() || "").slice(0, 1000) || null;
  if (body.tagTypes !== undefined) {
    const validTypes = ["VERBAL_ABUSE", "BLOCKING", "GRIEFING", "AFK", "TEAM_KILL", "OTHER"];
    const filtered = (Array.isArray(body.tagTypes) ? body.tagTypes : []).filter((t: string) => validTypes.includes(t));
    if (filtered.length > 0) { updateData.tagTypes = filtered; updateData.tagType = filtered[0]; }
  }
  if (body.evidences !== undefined) {
    const evArr = Array.isArray(body.evidences) ? body.evidences : [];
    updateData.evidences = evArr.filter((e: { type?: string; url?: string }) =>
      e && typeof e.url === "string" && /^https?:\/\//.test(e.url) && ["youtube", "link", "screenshot"].includes(e.type ?? "")
    ).slice(0, 20);
  }

  await prisma.mannerTag.update({ where: { id }, data: updateData });
  return NextResponse.json({ success: true });
}
