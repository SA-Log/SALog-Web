import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 페이지뷰 기록
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const path = body?.path;
  if (!path) return NextResponse.json({ ok: true });

  const session = await auth();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? null;
  const referer = req.headers.get("referer")?.slice(0, 500) ?? null;

  await prisma.pageView.create({
    data: {
      path,
      ip,
      userAgent,
      userId: session?.user?.id ?? null,
      referer,
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}

// 관리자: 방문 통계 조회
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!adminUser || !["MASTER", "VICE_MASTER", "OPERATOR"].includes(adminUser.role)) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const period = req.nextUrl.searchParams.get("period") ?? "today";

  const now = new Date();
  let since: Date;
  if (period === "7d") {
    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "30d") {
    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    // today (KST)
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    since = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 60 * 60 * 1000);
  }

  const [totalViews, uniqueIPs, recentViews, topPages] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: since } } }),
    prisma.pageView.groupBy({
      by: ["ip"],
      where: { createdAt: { gte: since }, ip: { not: null } },
    }).then(r => r.length),
    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, path: true, ip: true, userId: true, createdAt: true, referer: true },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    totalViews,
    uniqueVisitors: uniqueIPs,
    recentViews,
    topPages: topPages.map(p => ({ path: p.path, count: p._count })),
  });
}
