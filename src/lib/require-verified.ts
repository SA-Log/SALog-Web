import { prisma } from "@/lib/prisma";

/**
 * 병영수첩 인증 여부 확인. 미인증이면 에러 메시지 반환.
 */
export async function requireVerified(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { barracksVerified: true },
  });
  if (!user?.barracksVerified) {
    return "병영수첩 인증 후 이용할 수 있습니다";
  }
  return null;
}
