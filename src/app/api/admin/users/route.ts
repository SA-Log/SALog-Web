import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["MASTER", "VICE_MASTER", "OPERATOR"];

export async function GET(req: NextRequest) {
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

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const roleFilter = req.nextUrl.searchParams.get("role") ?? "ALL";

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (roleFilter !== "ALL") {
    where.role = roleFilter;
  }

  if (search) {
    where.OR = [
      { nickname: { contains: search, mode: "insensitive" } },
      { id: { contains: search } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      nickname: true,
      role: true,
      image: true,
      barracksVerified: true,
      barracksAddress: true,
      createdAt: true,
      bans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          type: true,
          reason: true,
          expiresAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ users });
}
