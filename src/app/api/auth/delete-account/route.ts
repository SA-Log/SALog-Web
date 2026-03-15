import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const rl = rateLimit(`delete:${session.user.id}`, { limit: 3, windowSec: 300 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  const body = await req.json();
  if (body.confirm !== "탈퇴합니다") {
    return NextResponse.json({ error: "확인 문구가 일치하지 않습니다" }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    // 1. 투표, 댓글 삭제
    await prisma.vote.deleteMany({ where: { userId } });
    await prisma.comment.deleteMany({ where: { userId } });

    // 2. 블랙리스트 삭제 (Cascade이지만 명시적으로)
    await prisma.blacklistEntry.deleteMany({ where: { userId } });

    // 3. 인증 요청 삭제
    await prisma.saVerification.deleteMany({ where: { userId } });

    // 4. 크리에이터 프로필 삭제
    await prisma.creatorProfile.deleteMany({ where: { userId } });

    // 5. 계정 연동 삭제 (카카오 등)
    await prisma.account.deleteMany({ where: { userId } });

    // 6. 세션 삭제
    await prisma.session.deleteMany({ where: { userId } });

    // 7. 유저 비활성화 (소프트 삭제)
    // 신고, 매너태그는 유지 — 작성자는 "탈퇴한 유저"로 표시
    const deletedNickname = `탈퇴한유저_${userId.slice(-6)}`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        nickname: deletedNickname,
        name: null,
        email: null,
        image: null,
        bio: null,
        phone: null,
        barracksAddress: null,
        barracksVerified: false,
        verificationCode: null,
        notificationEmail: null,
        isProfilePublic: false,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete-account] 에러:", err);
    return NextResponse.json({ error: "탈퇴 처리 중 오류가 발생했습니다" }, { status: 500 });
  }
}
