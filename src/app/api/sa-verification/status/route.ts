import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const verification = await prisma.saVerification.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      verificationCode: true,
      saNickname: true,
      status: true,
      adminNote: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  if (!verification) {
    return NextResponse.json({ status: "NONE" });
  }

  return NextResponse.json(verification);
}
