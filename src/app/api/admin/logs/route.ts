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

  const logs = await prisma.adminLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      detail: true,
      createdAt: true,
      actor: { select: { id: true, nickname: true, role: true } },
    },
  });

  return NextResponse.json({ logs });
}
