import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 헷갈리는 문자 제외 (0,O,1,I,L)
  let code = "SALog-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const rl = rateLimit(`sa-code:${session.user.id}`, { limit: 5, windowSec: 300 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 5분 후 다시 시도해주세요." }, { status: 429 });
  }

  // 이미 대기 중인 요청이 있으면 해당 코드 반환
  const existing = await prisma.saVerification.findFirst({
    where: { userId: session.user.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return NextResponse.json({ code: existing.verificationCode, id: existing.id });
  }

  const code = generateCode();
  const verification = await prisma.saVerification.create({
    data: {
      userId: session.user.id,
      verificationCode: code,
    },
  });

  return NextResponse.json({ code: verification.verificationCode, id: verification.id });
}
