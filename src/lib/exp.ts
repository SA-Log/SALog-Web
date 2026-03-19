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

// KST 기준 오늘 날짜 (YYYY-MM-DD)
function getKSTDate(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export async function isCheckedInToday(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastCheckIn: true },
  });
  if (!user?.lastCheckIn) return false;
  return getKSTDate(user.lastCheckIn) === getKSTDate(new Date());
}

export async function dailyCheckIn(userId: string): Promise<{ exp: number; streak: number; bonus: number } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastCheckIn: true, checkInStreak: true, exp: true },
  });
  if (!user) return null;

  const todayKST = getKSTDate(new Date());

  // 이미 출석했는지 확인 (KST 기준)
  if (user.lastCheckIn && getKSTDate(user.lastCheckIn) === todayKST) {
    return null;
  }

  // 연속 출석 계산 (KST 기준)
  let newStreak = 1;
  if (user.lastCheckIn) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (getKSTDate(user.lastCheckIn) === getKSTDate(yesterday)) {
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
      lastCheckIn: new Date(),
      checkInStreak: newStreak,
    },
    select: { exp: true },
  });

  return { exp: updated.exp, streak: newStreak, bonus };
}
