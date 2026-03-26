import { requireAdmin } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";



export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const admin = await requireAdmin(session.user.id);
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const nickname = req.nextUrl.searchParams.get("nickname");
  if (!nickname) {
    return NextResponse.json({ error: "닉네임을 입력해주세요" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { nickname },
    select: { id: true, nickname: true, barracksAddress: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}
