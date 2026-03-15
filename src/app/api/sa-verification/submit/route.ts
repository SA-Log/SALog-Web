import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { checkBarracksBan } from "@/lib/ban";
import { z } from "zod";

const CRAWLER_URL = process.env.CRAWLER_URL ?? "http://localhost:3001";
const CRAWLER_API_KEY = process.env.CRAWLER_API_KEY ?? "";

const submitSchema = z.object({
  nexonSn: z.string().regex(/^\d+$/, "올바른 병영주소가 아닙니다"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const rl = rateLimit(`sa-submit:${session.user.id}`, { limit: 5, windowSec: 300 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 5분 후 다시 시도해주세요." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "올바른 병영주소를 입력해주세요" }, { status: 400 });
  }

  const { nexonSn } = parsed.data;

  // 유저의 인증 코드 조회
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verificationCode: true, barracksVerified: true },
  });

  if (!user || !user.verificationCode) {
    return NextResponse.json({ error: "인증 코드가 없습니다" }, { status: 400 });
  }

  if (user.barracksVerified) {
    return NextResponse.json({ verified: true });
  }

  // 병영주소 밴 확인
  const barracksBan = await checkBarracksBan(nexonSn);
  if (barracksBan.banned) {
    return NextResponse.json({ error: "차단된 병영주소입니다. 사유: " + barracksBan.reason }, { status: 403 });
  }

  // 동일 병영주소로 이미 인증된 유저가 있는지 확인
  const existingBarracks = await prisma.user.findUnique({ where: { barracksAddress: nexonSn } });
  if (existingBarracks && existingBarracks.id !== session.user.id) {
    return NextResponse.json({ error: "이미 다른 계정에서 인증된 병영주소입니다" }, { status: 409 });
  }

  // 크롤링 서버로 프로필 조회
  try {
    const res = await fetch(`${CRAWLER_URL}/api/barracks/profile?nexonSn=${nexonSn}`, {
      headers: { "x-api-key": CRAWLER_API_KEY },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "병영수첩 조회에 실패했습니다" }, { status: 502 });
    }

    const data = await res.json();

    if (!data.found) {
      return NextResponse.json({ error: "해당 병영주소의 유저를 찾을 수 없습니다" });
    }

    // 자기소개에서 인증 코드 확인
    const intro = (data.userIntro ?? "").trim();
    if (!intro.includes(user.verificationCode)) {
      return NextResponse.json({
        error: "자기소개에서 인증 코드를 찾을 수 없습니다. 코드를 붙여넣고 저장했는지 확인해주세요.",
        verified: false,
      });
    }

    // 인증 성공 — DB 업데이트
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        barracksAddress: nexonSn,
        barracksVerified: true,
        nickname: data.nickname, // 서든어택 닉네임으로 변경
      },
    });

    return NextResponse.json({ verified: true, nickname: data.nickname });
  } catch (err) {
    console.error("[sa-verification/submit] 에러:", err);
    return NextResponse.json({ error: "인증 처리 중 오류가 발생했습니다" }, { status: 500 });
  }
}
