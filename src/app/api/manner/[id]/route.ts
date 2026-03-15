import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`manner-detail:${session.user.id}`, { limit: 30, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  if (!id || typeof id !== "string" || id.length > 50) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const report = await prisma.mannerTag.findUnique({
    where: { id },
    select: {
      id: true,
      nickname: true,
      barracksAddress: true,
      tagType: true,
      tagTypes: true,
      description: true,
      reporterId: true,
      createdAt: true,
      reporter: {
        select: { id: true, nickname: true, image: true },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
