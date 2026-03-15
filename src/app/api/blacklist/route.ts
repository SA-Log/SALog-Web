import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// 블랙리스트 목록 조회
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.blacklistEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      barracksAddress: true,
      nickname: true,
      memo: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ entries });
}

// 블랙리스트 추가
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const rl = rateLimit(`blacklist:${session.user.id}`, { limit: 20, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  const body = await req.json();
  const barracksAddress = body.barracksAddress?.trim();
  const nickname = body.nickname?.trim();
  const memo = body.memo?.trim() || null;

  if (!barracksAddress) {
    return NextResponse.json({ error: "병영주소가 필요합니다" }, { status: 400 });
  }

  // 이미 추가된 경우
  const existing = await prisma.blacklistEntry.findUnique({
    where: { userId_barracksAddress: { userId: session.user.id, barracksAddress } },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 블랙리스트에 추가된 유저입니다" }, { status: 409 });
  }

  const entry = await prisma.blacklistEntry.create({
    data: {
      userId: session.user.id,
      barracksAddress,
      nickname: nickname || null,
      memo,
    },
  });

  return NextResponse.json({ success: true, id: entry.id }, { status: 201 });
}

// 블랙리스트 삭제
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await req.json();
  const entryId = body.id;

  if (!entryId) {
    return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });
  }

  const entry = await prisma.blacklistEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.userId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  await prisma.blacklistEntry.delete({ where: { id: entryId } });
  return NextResponse.json({ success: true });
}
