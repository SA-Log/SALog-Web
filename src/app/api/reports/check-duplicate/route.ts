import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`check-dup:${session.user.id}`, {
    limit: 20,
    windowSec: 60,
  });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { nickname } = await req.json();
  if (!nickname || typeof nickname !== "string" || nickname.length > 50) {
    return NextResponse.json({ error: "nickname required" }, { status: 400 });
  }

  const existing = await prisma.hackReport.findFirst({
    where: { nickname },
    select: {
      id: true,
      nickname: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return NextResponse.json({
      duplicate: true,
      report: existing,
    });
  }

  return NextResponse.json({ duplicate: false });
}
