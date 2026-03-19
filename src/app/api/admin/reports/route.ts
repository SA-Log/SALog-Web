import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["MASTER", "VICE_MASTER", "OPERATOR"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!adminUser || !ADMIN_ROLES.includes(adminUser.role)) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "hack"; // hack | manner
  const status = url.searchParams.get("status");
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = 20;

  if (type === "manner") {
    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;

    const [reports, total] = await Promise.all([
      prisma.mannerTag.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, nickname: true, barracksAddress: true, status: true,
          tagTypes: true, description: true, adminNote: true, createdAt: true,
          reporter: { select: { id: true, nickname: true } },
          _count: { select: { votes: true, comments: true } },
        },
      }),
      prisma.mannerTag.count({ where }),
    ]);
    return NextResponse.json({ reports, total, page, totalPages: Math.ceil(total / limit) });
  }

  // 핵 신고
  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;

  const [reports, total] = await Promise.all([
    prisma.hackReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, nickname: true, barracksAddress: true, status: true,
        hackTypes: true, description: true, createdAt: true,
        reporter: { select: { id: true, nickname: true } },
        votes: { select: { voteType: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.hackReport.count({ where }),
  ]);

  const mapped = reports.map((r) => {
    const agreeCount = r.votes.filter((v) => v.voteType === "AGREE").length;
    const disagreeCount = r.votes.filter((v) => v.voteType === "DISAGREE").length;
    const { votes: _, ...rest } = r;
    return { ...rest, agreeCount, disagreeCount };
  });

  return NextResponse.json({ reports: mapped, total, page, totalPages: Math.ceil(total / limit) });
}
