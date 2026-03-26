import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyHackConfirmed } from "@/lib/discord";
import { requireAdmin } from "@/lib/require-admin";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["SUSPECT", "PROBABLE", "CONFIRMED", "DISMISSED"]),
  adminNote: z.string().min(1, "판정 사유를 입력해주세요").max(500),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const admin = await requireAdmin(session.user.id);
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다" }, { status: 400 });
  }

  const report = await prisma.hackReport.findUnique({
    where: { id },
    select: { id: true, nickname: true, barracksAddress: true, reporterId: true, evidences: true },
  });
  if (!report) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }

  // 확정 시 증거 필수 체크
  if (parsed.data.status === "CONFIRMED") {
    const hasEvidence = report.evidences && Array.isArray(report.evidences) && (report.evidences as unknown[]).length > 0;
    const hasAdditional = await prisma.additionalEvidence.count({ where: { hackReportId: id } });
    if (!hasEvidence && hasAdditional === 0) {
      return NextResponse.json({ error: "증거가 없는 신고는 확정할 수 없습니다" }, { status: 400 });
    }
  }

  const updated = await prisma.hackReport.update({
    where: { id },
    data: { status: parsed.data.status, adminNote: parsed.data.adminNote },
    select: { id: true, status: true, nickname: true, adminNote: true },
  });

  // 관리 로그
  const { logAdminAction } = await import("@/lib/admin-log");
  logAdminAction({ actorId: session.user.id, action: `핵 신고 ${parsed.data.status}`, targetType: "hackReport", targetId: id, detail: `${report.nickname} — ${parsed.data.adminNote}` });

  // 핵 확정/유력 시 경험치 + 디스코드 알림
  if (parsed.data.status === "CONFIRMED" || parsed.data.status === "PROBABLE") {
    const { grantExp, EXP_TABLE } = await import("@/lib/exp");
    const isConfirmed = parsed.data.status === "CONFIRMED";

    const reporterExp = isConfirmed ? EXP_TABLE.reporterConfirmed : EXP_TABLE.reporterProbable;
    grantExp(report.reporterId, reporterExp).catch(() => {});

    const contributorExp = isConfirmed ? EXP_TABLE.contributorConfirmed : EXP_TABLE.contributorProbable;
    const contributors = await prisma.additionalEvidence.findMany({
      where: { hackReportId: id },
      select: { userId: true },
      distinct: ["userId"],
    });
    for (const c of contributors) {
      if (c.userId !== report.reporterId) {
        grantExp(c.userId, contributorExp).catch(() => {});
      }
    }

    if (isConfirmed) {
      notifyHackConfirmed({ nickname: report.nickname, reportId: report.id, barracksAddress: report.barracksAddress }).catch(() => {});
    }
  }

  return NextResponse.json(updated);
}
