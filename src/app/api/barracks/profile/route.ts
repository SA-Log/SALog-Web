import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const BARRACKS_API = "https://barracks.sa.nexon.com/api";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다", found: false }, { status: 401 });
  }

  const rl = rateLimit(`barracks-profile:${session.user.id}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다", found: false }, { status: 429 });
  }

  const nexonSn = req.nextUrl.searchParams.get("nexonSn");
  if (!nexonSn || !/^\d+$/.test(nexonSn)) {
    return NextResponse.json({ error: "올바른 병영주소가 아닙니다", found: false }, { status: 400 });
  }

  try {
    const res = await fetch(`${BARRACKS_API}/Profile/GetProfileMain/${nexonSn}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://barracks.sa.nexon.com/",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "병영수첩 조회에 실패했습니다", found: false });
    }

    const data = await res.json();

    if (data.rtnCode !== 0 || !data.result?.isFounded) {
      return NextResponse.json({ error: "해당 병영주소의 유저를 찾을 수 없습니다", found: false });
    }

    const { characterInfo, profileInfo } = data.result;

    return NextResponse.json({
      found: true,
      nickname: characterInfo.user_nick,
      nexonSn: characterInfo.user_nexon_sn,
      userIntro: profileInfo?.user_intro ?? "",
      userImg: profileInfo?.user_img ?? null,
      level: characterInfo.level_no,
      clanName: characterInfo.clan_name ?? null,
    });
  } catch {
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다", found: false }, { status: 500 });
  }
}
