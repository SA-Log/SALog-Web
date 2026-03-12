import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nicknameSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const signupSchema = z.object({
  nickname: nicknameSchema,
  notificationEmail: z.string().email("올바른 이메일 형식이 아닙니다").optional().or(z.literal("")),
});

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

  const { nickname, notificationEmail } = parsed.data;

  const existingNickname = await prisma.user.findUnique({ where: { nickname } });
  if (existingNickname && existingNickname.id !== session.user.id) {
    return NextResponse.json({ error: "이미 사용 중인 닉네임입니다" }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      nickname,
      notificationEmail: notificationEmail || null,
      isProfileComplete: true,
    },
  });

  return NextResponse.json({ success: true });
}
