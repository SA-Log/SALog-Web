import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireVerified } from "@/lib/require-verified";

// 추가 증거 조회
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const evidences = await prisma.additionalEvidence.findMany({
    where: { hackReportId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      evidences: true,
      description: true,
      createdAt: true,
      user: { select: { id: true, nickname: true, image: true, barracksVerified: true } },
    },
  });

  return NextResponse.json({ evidences });
}

// 추가 증거 제출
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const verifyErr = await requireVerified(session.user.id);
  if (verifyErr) return NextResponse.json({ error: verifyErr }, { status: 403 });

  const rl = rateLimit(`evidence:${session.user.id}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  const { id } = await params;
  const body = await req.json();
  const description = (body.description?.trim() || "").slice(0, 1000) || null;

  // 증거 검증
  const rawEvidences = Array.isArray(body.evidences) ? body.evidences : [];
  const evidences = rawEvidences.filter((e: { type?: string; url?: string; name?: string }) =>
    e && typeof e.url === "string" && /^https?:\/\//.test(e.url) && ["youtube", "link", "screenshot", "video"].includes(e.type ?? "")
  ).slice(0, 20);

  if (evidences.length === 0) {
    return NextResponse.json({ error: "유효한 증거를 1개 이상 첨부해주세요" }, { status: 400 });
  }

  // 신고 존재 확인
  const report = await prisma.hackReport.findUnique({
    where: { id },
    select: { id: true, reporterId: true },
  });
  if (!report) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }

  // 본인 글에는 추가 증거 불가 (본인은 편집 기능 사용)
  if (report.reporterId === session.user.id) {
    return NextResponse.json({ error: "본인 글에는 편집 기능을 사용하세요" }, { status: 400 });
  }

  const evidence = await prisma.additionalEvidence.create({
    data: {
      hackReportId: id,
      userId: session.user.id,
      evidences,
      description,
    },
    select: {
      id: true,
      evidences: true,
      description: true,
      createdAt: true,
      user: { select: { id: true, nickname: true, image: true, barracksVerified: true } },
    },
  });

  // 경험치 지급 (증거 제출)
  const { grantExp } = await import("@/lib/exp");
  grantExp(session.user.id, 2).catch(() => {});

  return NextResponse.json(evidence, { status: 201 });
}
