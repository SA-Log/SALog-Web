import { prisma } from "@/lib/prisma";

export const ADMIN_ROLES = ["MASTER", "VICE_MASTER", "OPERATOR"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export async function requireAdmin(userId: string): Promise<{ role: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || !ADMIN_ROLES.includes(user.role as AdminRole)) return null;
  return { role: user.role };
}
