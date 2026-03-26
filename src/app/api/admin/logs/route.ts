import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";



export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const admin = await requireAdmin(session.user.id);
  if (!admin) {
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
