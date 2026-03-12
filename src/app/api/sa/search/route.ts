import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NEXON_OPEN_API_KEY ?? "";
const BASE = "https://open.api.nexon.com/suddenattack/v1";

export async function GET(req: NextRequest) {
  const nickname = req.nextUrl.searchParams.get("q")?.trim();
  if (!nickname) {
    return NextResponse.json({ error: "검색어를 입력해주세요" }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다" }, { status: 500 });
  }

  const headers = { "x-nxopen-api-key": API_KEY };

  try {
    // 1) nickname → ouid
    const idRes = await fetch(`${BASE}/id?user_name=${encodeURIComponent(nickname)}`, { headers });
    if (!idRes.ok) {
      if (idRes.status === 400) {
        return NextResponse.json({ error: "유저를 찾을 수 없습니다", found: false });
      }
      const err = await idRes.json().catch(() => ({}));
      return NextResponse.json({ error: err?.error?.message ?? "API 오류", found: false }, { status: idRes.status });
    }
    const { ouid } = await idRes.json();

    // 2) basic info
    const basicRes = await fetch(`${BASE}/user/basic?ouid=${ouid}`, { headers });
    const basic = basicRes.ok ? await basicRes.json() : null;

    // 3) rank info
    const rankRes = await fetch(`${BASE}/user/rank?ouid=${ouid}`, { headers });
    const rank = rankRes.ok ? await rankRes.json() : null;

    return NextResponse.json({
      found: true,
      ouid,
      basic,
      rank,
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
