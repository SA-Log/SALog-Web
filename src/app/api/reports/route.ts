import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const DAILY_REPORT_LIMIT = 5;

const VALID_HACK_TYPES = ["aimbot", "wallhack", "speedhack", "norecoil", "other"] as const;

const createReportSchema = z.object({
  barracksAddress: z.string().max(200).optional().or(z.literal("")),
  nickname: z.string().min(1).max(50),
  hackTypes: z
    .array(z.enum(VALID_HACK_TYPES))
    .min(1, "핵 유형을 1개 이상 선택해주세요")
    .max(VALID_HACK_TYPES.length),
  description: z.string().max(500).optional().or(z.literal("")),
  evidences: z
    .array(
      z.object({
        type: z.enum(["youtube", "link", "screenshot", "video"]),
        url: z.string().url().max(2000),
        name: z.string().max(200),
      })
    )
    .max(20)
    .optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const rl = rateLimit(`report:${session.user.id}`, {
    limit: 10,
    windowSec: 60,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // 오늘 신고 수 확인
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await prisma.hackReport.count({
    where: {
      reporterId: session.user.id,
      createdAt: { gte: todayStart },
    },
  });

  if (todayCount >= DAILY_REPORT_LIMIT) {
    return NextResponse.json(
      { error: "오늘 신고 등록 한도(5건)에 도달했습니다" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { barracksAddress, nickname, hackTypes, description, evidences } =
    parsed.data;

  const report = await prisma.hackReport.create({
    data: {
      barracksAddress: barracksAddress || "",
      nickname,
      hackTypes,
      description: description || null,
      evidences: evidences ?? [],
      reporterId: session.user.id,
    },
  });

  return NextResponse.json({ id: report.id, success: true }, { status: 201 });
}

// 오늘 신고 수 조회
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await prisma.hackReport.count({
    where: {
      reporterId: session.user.id,
      createdAt: { gte: todayStart },
    },
  });

  return NextResponse.json({ todayCount, limit: DAILY_REPORT_LIMIT });
}
