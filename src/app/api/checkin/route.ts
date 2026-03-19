import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dailyCheckIn } from "@/lib/exp";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const result = await dailyCheckIn(session.user.id);
  if (!result) {
    return NextResponse.json({ error: "오늘 이미 출석했습니다" }, { status: 409 });
  }

  return NextResponse.json(result);
}
