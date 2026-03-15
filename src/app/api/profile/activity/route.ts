import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = req.nextUrl.searchParams.get("userId") ?? session.user.id;

  const [hackReports, mannerReports] = await Promise.all([
    prisma.hackReport.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        nickname: true,
        status: true,
        hackTypes: true,
        evidences: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.mannerTag.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        nickname: true,
        tagType: true,
        tagTypes: true,
        evidences: true,
        description: true,
        createdAt: true,
      },
    }),
  ]);

  // 통합 + 정렬
  const activities = [
    ...hackReports.map((r) => ({ ...r, reportType: "hack" as const })),
    ...mannerReports.map((r) => ({ ...r, reportType: "manner" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ activities });
}
