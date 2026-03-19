import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["MASTER", "VICE_MASTER", "OPERATOR"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!adminUser || !ADMIN_ROLES.includes(adminUser.role)) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const [
    pendingHackCount,
    confirmedHackCount,
    pendingMannerCount,
    totalUsers,
    totalBans,
    recentHackReports,
    recentMannerReports,
  ] = await Promise.all([
    prisma.hackReport.count({ where: { status: { in: ["SUSPECT", "PROBABLE"] } } }),
    prisma.hackReport.count({ where: { status: "CONFIRMED" } }),
    prisma.mannerTag.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.ban.count(),
    prisma.hackReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, nickname: true, status: true, hackTypes: true, createdAt: true,
        reporter: { select: { nickname: true } },
        _count: { select: { votes: true, comments: true } },
      },
    }),
    prisma.mannerTag.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, nickname: true, status: true, tagTypes: true, createdAt: true,
        reporter: { select: { nickname: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: { pendingHackCount, confirmedHackCount, pendingMannerCount, totalUsers, totalBans },
    recentHackReports,
    recentMannerReports,
  });
}
