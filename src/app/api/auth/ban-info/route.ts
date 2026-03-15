import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const ban = await prisma.ban.findFirst({
    where: {
      userId: session.user.id,
      type: { not: "WARNING" },
      OR: [
        { type: "PERMANENT" },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      type: true,
      reason: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  if (!ban) {
    return NextResponse.json({ ban: null });
  }

  return NextResponse.json({ ban });
}
