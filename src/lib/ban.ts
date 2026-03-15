import { prisma } from "@/lib/prisma";

export interface BanInfo {
  banned: boolean;
  reason?: string;
  type?: string;
  expiresAt?: Date | null;
}

/**
 * 유저 ID로 활성 밴 확인
 */
export async function checkUserBan(userId: string): Promise<BanInfo> {
  const ban = await prisma.ban.findFirst({
    where: {
      userId,
      type: { not: "WARNING" },
      OR: [
        { type: "PERMANENT" },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!ban) return { banned: false };

  return {
    banned: true,
    reason: ban.reason,
    type: ban.type,
    expiresAt: ban.expiresAt,
  };
}

/**
 * 병영주소로 밴 확인
 */
export async function checkBarracksBan(barracksAddress: string): Promise<BanInfo> {
  const ban = await prisma.ban.findFirst({
    where: {
      barracksAddress,
      type: { not: "WARNING" },
      OR: [
        { type: "PERMANENT" },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!ban) return { banned: false };

  return {
    banned: true,
    reason: ban.reason,
    type: ban.type,
    expiresAt: ban.expiresAt,
  };
}
