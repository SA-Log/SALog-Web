import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["MASTER", "VICE_MASTER", "OPERATOR"];

const banSchema = z.object({
  userId: z.string().optional(),
  barracksAddress: z.string().optional(),
  reason: z.string().min(1, "사유를 입력해주세요"),
  type: z.enum(["WARNING", "TEMP", "PERMANENT"]),
  expiresAt: z.string().datetime().optional(),
});

// 밴 부여
export async function POST(req: Request) {
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

  const body = await req.json();
  const parsed = banSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다" }, { status: 400 });
  }

  const { userId, barracksAddress, reason, type, expiresAt } = parsed.data;

  if (!userId && !barracksAddress) {
    return NextResponse.json({ error: "userId 또는 barracksAddress가 필요합니다" }, { status: 400 });
  }

  const ban = await prisma.ban.create({
    data: {
      userId: userId || null,
      barracksAddress: barracksAddress || null,
      reason,
      type,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      bannedBy: session.user.id,
    },
  });

  return NextResponse.json({ success: true, ban });
}

// 밴 목록 조회
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

  const bans = await prisma.ban.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { nickname: true, barracksAddress: true } },
    },
  });

  return NextResponse.json({ bans });
}
