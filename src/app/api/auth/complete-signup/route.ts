import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const signupSchema = z.object({
  notificationEmail: z.string().email("올바른 이메일 형식이 아닙니다").optional().or(z.literal("")),
});

function generateRandomNickname(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `신병_${suffix}`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const rl = rateLimit(`signup:${session.user.id}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { notificationEmail } = parsed.data;

  // 중복 없는 랜덤 닉네임 생성 (최대 10회 시도)
  let nickname = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateRandomNickname();
    const existing = await prisma.user.findUnique({ where: { nickname: candidate } });
    if (!existing) {
      nickname = candidate;
      break;
    }
  }
  if (!nickname) {
    return NextResponse.json({ error: "닉네임 생성에 실패했습니다. 다시 시도해주세요." }, { status: 500 });
  }

  const { randomBytes } = await import("crypto");
  const verificationCode = randomBytes(4).toString("hex").toUpperCase();

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nickname,
        verificationCode,
        notificationEmail: notificationEmail || null,
        isProfileComplete: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[complete-signup] DB 에러:", err);
    return NextResponse.json({ error: "가입 처리 중 오류가 발생했습니다" }, { status: 500 });
  }
}
