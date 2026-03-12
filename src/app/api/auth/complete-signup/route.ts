import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completeSignupSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // Rate limit: 10 requests per minute per user
  const rl = rateLimit(`signup:${session.user.id}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = completeSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { nickname, phone, barracksAddress, barracksVerified, notificationEmail } = parsed.data;

  // 닉네임 중복 확인
  const existingNickname = await prisma.user.findUnique({ where: { nickname } });
  if (existingNickname && existingNickname.id !== session.user.id) {
    return NextResponse.json({ error: "이미 사용 중인 닉네임입니다" }, { status: 409 });
  }

  // 전화번호 중복 확인 (입력된 경우만)
  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone && existingPhone.id !== session.user.id) {
      return NextResponse.json({ error: "이미 등록된 전화번호입니다" }, { status: 409 });
    }
  }

  // 프로필 업데이트
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      nickname,
      phone: phone || null,
      barracksAddress: barracksAddress || null,
      barracksVerified: !!barracksAddress && barracksVerified,
      notificationEmail: notificationEmail || null,
      isProfileComplete: true,
    },
  });

  return NextResponse.json({ success: true });
}
