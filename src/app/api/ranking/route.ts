import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = 50;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null, isProfileComplete: true },
      orderBy: { exp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        nickname: true,
        image: true,
        exp: true,
        barracksVerified: true,
        role: true,
        checkInStreak: true,
        _count: {
          select: {
            hackReports: true,
            votes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.user.count({ where: { deletedAt: null, isProfileComplete: true } }),
  ]);

  const ranked = users.map((u, i) => ({
    ...u,
    rank: (page - 1) * limit + i + 1,
  }));

  return NextResponse.json({ users: ranked, total, page, totalPages: Math.ceil(total / limit) });
}
