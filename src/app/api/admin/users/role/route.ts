import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VALID_ROLES = ["USER", "VERIFIED_CREATOR", "OPERATOR", "VICE_MASTER", "MASTER"];

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "VERIFIED_CREATOR", "OPERATOR", "VICE_MASTER"] as const),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // 마스터만 역할 변경 가능
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!admin || admin.role !== "MASTER") {
    return NextResponse.json({ error: "마스터만 역할을 변경할 수 있습니다" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다" }, { status: 400 });
  }

  const { userId, role } = parsed.data;

  // 자기 자신 역할 변경 불가
  if (userId === session.user.id) {
    return NextResponse.json({ error: "자신의 역할은 변경할 수 없습니다" }, { status: 400 });
  }

  // 대상 유저 확인
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!targetUser) {
    return NextResponse.json({ error: "유저를 찾을 수 없습니다" }, { status: 404 });
  }

  // 마스터 대상은 변경 불가
  if (targetUser.role === "MASTER") {
    return NextResponse.json({ error: "마스터 역할은 변경할 수 없습니다" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json({ success: true });
}
