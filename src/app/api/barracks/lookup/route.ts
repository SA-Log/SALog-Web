import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NEXON_OPEN_API_KEY ?? "";
const BASE = "https://open.api.nexon.com/suddenattack/v1";

export async function POST(req: NextRequest) {
  try {
    const { nickname } = await req.json();

    if (!nickname || typeof nickname !== "string" || nickname.trim().length < 1) {
      return NextResponse.json({ error: "닉네임을 입력해주세요.", found: false }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "API 키가 설정되지 않았습니다.", found: false }, { status: 500 });
    }

    const headers = { "x-nxopen-api-key": API_KEY };
    const trimmed = nickname.trim();

    // 넥슨 API로 닉네임 → ouid 조회
    const idRes = await fetch(`${BASE}/id?user_name=${encodeURIComponent(trimmed)}`, { headers });

    if (!idRes.ok) {
      if (idRes.status === 400) {
        return NextResponse.json({ found: false, error: "해당 닉네임의 유저를 찾을 수 없습니다." });
      }
      return NextResponse.json({ found: false, error: "넥슨 API 조회에 실패했습니다." });
    }

    const { ouid } = await idRes.json();

    // 기본 정보 조회하여 닉네임 확인
    const basicRes = await fetch(`${BASE}/user/basic?ouid=${ouid}`, { headers });
    if (!basicRes.ok) {
      return NextResponse.json({ found: false, error: "유저 정보를 가져올 수 없습니다." });
    }

    const basic = await basicRes.json();
    const confirmedNickname = basic.user_name ?? trimmed;

    return NextResponse.json({
      found: true,
      nickname: confirmedNickname,
      ouid,
    });
  } catch {
    return NextResponse.json({ found: false, error: "조회 중 오류가 발생했습니다." });
  }
}
