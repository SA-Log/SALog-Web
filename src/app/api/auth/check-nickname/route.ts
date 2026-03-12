import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nicknameSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // Rate limit: 20 requests per minute
  const rl = rateLimit(`nickname:${session.user.id}`, { limit: 20, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = nicknameSchema.safeParse(body.nickname);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const nickname = parsed.data;
  const existing = await prisma.user.findUnique({ where: { nickname } });
  const available = !existing || existing.id === session.user.id;

  return NextResponse.json({ available });
}
