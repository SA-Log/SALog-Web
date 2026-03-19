import { prisma } from "@/lib/prisma";
import { EXP_TABLE } from "@/lib/exp-table";
export { EXP_TABLE };

export async function grantExp(userId: string, amount: number): Promise<number> {
  if (amount <= 0) return 0;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { exp: { increment: amount } },
    select: { exp: true },
  });
  return user.exp;
}

export async function dailyCheckIn(userId: string): Promise<{ exp: number; streak: number; bonus: number } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastCheckIn: true, checkInStreak: true, exp: true },
  });
  if (!user) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (user.lastCheckIn) {
    const lastDate = new Date(user.lastCheckIn.getFullYear(), user.lastCheckIn.getMonth(), user.lastCheckIn.getDate());
    if (lastDate.getTime() === today.getTime()) return null; // 이미 출석
  }

  // 연속 출석 계산
  let newStreak = 1;
  if (user.lastCheckIn) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastDate = new Date(user.lastCheckIn.getFullYear(), user.lastCheckIn.getMonth(), user.lastCheckIn.getDate());
    if (lastDate.getTime() === yesterday.getTime()) {
      newStreak = user.checkInStreak + 1;
    }
  }

  // 스트릭 보너스
  let bonus = 0;
  if (newStreak >= 365) bonus = EXP_TABLE.streak365;
  else if (newStreak >= 90) bonus = EXP_TABLE.streak90;
  else if (newStreak >= 30) bonus = EXP_TABLE.streak30;
  else if (newStreak >= 7) bonus = EXP_TABLE.streak7;
  else if (newStreak >= 3) bonus = EXP_TABLE.streak3;

  const totalGain = EXP_TABLE.dailyCheckIn + bonus;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      exp: { increment: totalGain },
      lastCheckIn: now,
      checkInStreak: newStreak,
    },
    select: { exp: true },
  });

  return { exp: updated.exp, streak: newStreak, bonus };
}
