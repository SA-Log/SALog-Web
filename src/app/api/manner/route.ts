import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const VALID_TAG_TYPES = ["VERBAL_ABUSE", "BLOCKING", "GRIEFING", "AFK", "TEAM_KILL", "OTHER"] as const;

const createSchema = z.object({
  barracksAddress: z.string().min(1).max(200),
  nickname: z.string().min(1).max(50),
  tagType: z.enum(VALID_TAG_TYPES),
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

  const { barracksAddress, nickname, tagType, description } = parsed.data;

  const tag = await prisma.mannerTag.create({
    data: {
      barracksAddress,
      nickname,
      tagType,
      description: description || null,
      reporterId: session.user.id,
    },
  });

  return NextResponse.json({ id: tag.id, success: true }, { status: 201 });
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
    where.tagType = tagType;
  }

  const orderBy = sort === "oldest"
    ? { createdAt: "asc" as const }
    : { createdAt: "desc" as const };

  const [tags, total] = await Promise.all([
    prisma.mannerTag.findMany({
      where,
      orderBy,
      take: 50,
      select: {
        id: true,
        nickname: true,
        barracksAddress: true,
        tagType: true,
        description: true,
        createdAt: true,
        reporter: { select: { id: true, nickname: true, image: true } },
      },
    }),
    prisma.mannerTag.count({ where }),
  ]);

  return NextResponse.json({ tags, total });
}
