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

  try {
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
  } catch (err) {
    console.error("[reports/POST] 에러:", err);
    return NextResponse.json({ error: "신고 등록에 실패했습니다" }, { status: 500 });
  }
}

// 신고 목록 조회 + 오늘 신고 수
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode"); // "list" | null (default: todayCount)

  if (mode === "list") {
    const status = url.searchParams.get("status"); // SUSPECT, PROBABLE, CONFIRMED, DISMISSED
    const sort = url.searchParams.get("sort") ?? "latest"; // latest, oldest
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = 20;

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const orderBy = sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

    const [reports, total] = await Promise.all([
      prisma.hackReport.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          nickname: true,
          barracksAddress: true,
          status: true,
          hackTypes: true,
          description: true,
          evidences: true,
          youtubeUrl: true,
          createdAt: true,
          reporter: { select: { id: true, nickname: true, image: true } },
          votes: { select: { voteType: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.hackReport.count({ where }),
    ]);

    const mapped = reports.map((r) => {
      const agreeCount = r.votes.filter((v) => v.voteType === "AGREE").length;
      const disagreeCount = r.votes.filter((v) => v.voteType === "DISAGREE").length;
      const unsureCount = r.votes.length - agreeCount - disagreeCount;
      const { votes: _, ...rest } = r;
      return { ...rest, agreeCount, unsureCount, disagreeCount };
    });

    return NextResponse.json({ reports: mapped, total, page, totalPages: Math.ceil(total / limit) });
  }

  // 기본: 오늘 신고 수 조회
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
