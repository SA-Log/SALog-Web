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

  const rl = rateLimit(`profile:${session.user.id}`, {
    limit: 30,
    windowSec: 60,
  });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  if (!id || typeof id !== "string" || id.length > 30) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nickname: true,
      image: true,
      role: true,
      bio: true,
      isProfilePublic: true,
      barracksAddress: true,
      barracksVerified: true,
      createdAt: true,
      _count: {
        select: {
          hackReports: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwn = session.user.id === id;

  // 비공개 프로필은 본인만 전체 정보 확인 가능
  if (!user.isProfilePublic && !isOwn) {
    return NextResponse.json({
      id: user.id,
      nickname: user.nickname,
      image: user.image,
      role: user.role,
      isPrivate: true,
    });
  }

  // 최근 신고 목록
  const recentReports = await prisma.hackReport.findMany({
    where: { reporterId: id },
    select: {
      id: true,
      nickname: true,
      status: true,
      hackTypes: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    id: user.id,
    nickname: user.nickname,
    image: user.image,
    role: user.role,
    bio: user.bio,
    isProfilePublic: user.isProfilePublic,
    barracksAddress: user.barracksAddress,
    barracksVerified: user.barracksVerified,
    createdAt: user.createdAt,
    reportCount: user._count.hackReports,
    recentReports,
    isOwn,
    isPrivate: false,
  });
}
