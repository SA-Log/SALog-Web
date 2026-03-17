import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireVerified } from "@/lib/require-verified";
import { notifyNewReport } from "@/lib/discord";
import { NextResponse } from "next/server";
import { z } from "zod";

const VALID_TAG_TYPES = ["VERBAL_ABUSE", "BLOCKING", "GRIEFING", "AFK", "TEAM_KILL", "OTHER"] as const;

const createSchema = z.object({
  barracksAddress: z.string().min(1).max(200),
  nickname: z.string().min(1).max(50),
  tagTypes: z.array(z.enum(VALID_TAG_TYPES)).min(1, "비매너 유형을 1개 이상 선택해주세요"),
  description: z.string().max(1000).optional().or(z.literal("")),
  evidences: z.array(z.object({
    type: z.enum(["youtube", "link", "screenshot"]),
    url: z.string().url().max(2000),
    name: z.string().max(200),
  })).max(20).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const verifyErr = await requireVerified(session.user.id);
  if (verifyErr) return NextResponse.json({ error: verifyErr }, { status: 403 });

  const rl = rateLimit(`manner:${session.user.id}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다" }, { status: 400 });
  }

  const { barracksAddress, nickname, tagTypes, description, evidences } = parsed.data;

  try {
    const report = await prisma.mannerTag.create({
      data: {
        barracksAddress,
        nickname,
        tagType: tagTypes[0],
        tagTypes,
        description: description || null,
        evidences: evidences ?? [],
        reporterId: session.user.id,
      },
    });

    const reporter = await prisma.user.findUnique({ where: { id: session.user.id }, select: { nickname: true } });
    notifyNewReport({ type: "manner", nickname, reportId: report.id, reporterName: reporter?.nickname ?? "유저", description }).catch(() => {});

    return NextResponse.json({ id: report.id, success: true }, { status: 201 });
  } catch (err) {
    console.error("[manner/POST] 에러:", err);
    return NextResponse.json({ error: "등록에 실패했습니다" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // 비로그인 조회 허용
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
        evidences: true,
        createdAt: true,
        reporterId: true,
        reporter: { select: { id: true, nickname: true, image: true, barracksVerified: true } },
      },
    }),
    prisma.mannerTag.count({ where }),
  ]);

  return NextResponse.json({ reports, total });
}
