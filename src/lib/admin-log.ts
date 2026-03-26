import { prisma } from "@/lib/prisma";

export async function logAdminAction(params: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: string;
}) {
  await prisma.adminLog.create({ data: params }).catch((err) => {
    console.error("[admin-log] 기록 실패:", err);
  });
}
