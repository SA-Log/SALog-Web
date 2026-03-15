import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const VALID_TAG_TYPES = ["VERBAL_ABUSE", "BLOCKING", "GRIEFING", "AFK", "TEAM_KILL", "OTHER"] as const;

const createSchema = z.object({
  barracksAddress: z.string().min(1).max(200),
  nickname: z.string().min(1).max(50),
  tagTypes: z.array(z.enum(VALID_TAG_TYPES)).min(1, "비매너 유형을 1개 이상 선택해주세요"),
  description: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const rl = rateLimit(`manner:${session.user.id}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다" }, { status: 400 });
  }

  const { barracksAddress, nickname, tagTypes, description } = parsed.data;

  try {
    const report = await prisma.mannerTag.create({
      data: {
        barracksAddress,
        nickname,
        tagType: tagTypes[0], // 대표 유형 (하위 호환)
        tagTypes,
        description: description || null,
        reporterId: session.user.id,
      },
    });

    return NextResponse.json({ id: report.id, success: true }, { status: 201 });
  } catch (err) {
    console.error("[manner/POST] 에러:", err);
    return NextResponse.json({ error: "등록에 실패했습니다" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const tagType = url.searchParams.get("tagType");
  const sort = url.searchParams.get("sort") ?? "latest";

  const where: Record<string, unknown> = {};
  if (tagType && tagType !== "ALL") {
    where.tagTypes = { has: tagType };
  }

  const orderBy = sort === "oldest"
    ? { createdAt: "asc" as const }
    : { createdAt: "desc" as const };

  const [reports, total] = await Promise.all([
    prisma.mannerTag.findMany({
      where,
      orderBy,
      take: 50,
      select: {
        id: true,
        nickname: true,
        barracksAddress: true,
        tagType: true,
        tagTypes: true,
        description: true,
        createdAt: true,
        reporterId: true,
        reporter: { select: { id: true, nickname: true, image: true } },
      },
    }),
    prisma.mannerTag.count({ where }),
  ]);

  return NextResponse.json({ reports, total });
}
