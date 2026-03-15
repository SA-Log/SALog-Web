import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verificationCode: true, barracksVerified: true },
  });

  if (!user) {
    return NextResponse.json({ error: "유저를 찾을 수 없습니다" }, { status: 404 });
  }

  if (user.barracksVerified) {
    return NextResponse.json({ code: user.verificationCode, verified: true });
  }

  // 코드가 없으면 생성 (cuid 끝 4자리)
  let code = user.verificationCode;
  if (!code) {
    code = session.user.id.slice(-4).toUpperCase();
    await prisma.user.update({
      where: { id: session.user.id },
      data: { verificationCode: code },
    });
  }

  return NextResponse.json({ code });
}
