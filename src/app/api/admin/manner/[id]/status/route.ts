import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "REJECTED"]),
  adminNote: z.string().max(500).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const admin = await requireAdmin(session.user.id);
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다" }, { status: 400 });
  }

  const report = await prisma.mannerTag.findUnique({ where: { id }, select: { id: true, nickname: true } });
  if (!report) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }

  const updated = await prisma.mannerTag.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminNote: parsed.data.adminNote || null,
    },
    select: { id: true, status: true, adminNote: true },
  });

  const { logAdminAction } = await import("@/lib/admin-log");
  logAdminAction({ actorId: session.user.id, action: `비매너 ${parsed.data.status}`, targetType: "mannerTag", targetId: id, detail: report?.nickname });

  return NextResponse.json(updated);
}
