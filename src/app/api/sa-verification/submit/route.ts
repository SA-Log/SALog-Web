import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const submitSchema = z.object({
  verificationId: z.string().min(1),
  saNickname: z.string().min(1, "서든어택 닉네임을 입력해주세요").max(20),
  screenshotBase64: z.string().min(1, "스크린샷을 업로드해주세요"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const rl = rateLimit(`sa-submit:${session.user.id}`, { limit: 3, windowSec: 300 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 5분 후 다시 시도해주세요." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다" }, { status: 400 });
  }

  const { verificationId, saNickname, screenshotBase64 } = parsed.data;

  // 본인의 PENDING 요청인지 확인
  const verification = await prisma.saVerification.findFirst({
    where: { id: verificationId, userId: session.user.id, status: "PENDING" },
  });

  if (!verification) {
    return NextResponse.json({ error: "유효한 인증 요청을 찾을 수 없습니다" }, { status: 404 });
  }

  // Base64 이미지를 그대로 DB에 저장 (5MB 제한)
  if (screenshotBase64.length > 7_000_000) {
    return NextResponse.json({ error: "이미지 크기가 너무 큽니다 (최대 5MB)" }, { status: 400 });
  }

  await prisma.saVerification.update({
    where: { id: verificationId },
    data: {
      saNickname: saNickname.trim(),
      screenshotUrl: screenshotBase64,
    },
  });

  return NextResponse.json({ success: true });
}
