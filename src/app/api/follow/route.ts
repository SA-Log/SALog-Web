import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// 팔로우 / 언팔로우 토글
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // 미인증 유저는 팔로우 불가
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { barracksVerified: true },
  });
  if (!currentUser?.barracksVerified) {
    return NextResponse.json({ error: "병영수첩 인증 후 팔로우할 수 있습니다" }, { status: 403 });
  }

  const rl = rateLimit(`follow:${session.user.id}`, { limit: 30, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 });
  }

  const { targetUserId } = await req.json();
  if (!targetUserId || typeof targetUserId !== "string") {
    return NextResponse.json({ error: "대상 유저가 필요합니다" }, { status: 400 });
  }

  if (targetUserId === session.user.id) {
    return NextResponse.json({ error: "자기 자신을 팔로우할 수 없습니다" }, { status: 400 });
  }

  // 대상 유저 존재 확인
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, deletedAt: true },
  });
  if (!targetUser || targetUser.deletedAt) {
    return NextResponse.json({ error: "존재하지 않는 유저입니다" }, { status: 404 });
  }

  // 이미 팔로우 중인지 확인
  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    },
  });

  if (existing) {
    // 언팔로우
    await prisma.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  } else {
    // 팔로우
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    });
    return NextResponse.json({ following: true });
  }
}

// 팔로우 상태 확인
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const targetUserId = req.nextUrl.searchParams.get("userId");
  if (!targetUserId) {
    return NextResponse.json({ error: "userId가 필요합니다" }, { status: 400 });
  }

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    },
  });

  // 상대방도 나를 팔로우하는지
  const followBack = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: targetUserId,
        followingId: session.user.id,
      },
    },
  });

  // 팔로워/팔로잉 수
  const [followerCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: targetUserId } }),
    prisma.follow.count({ where: { followerId: targetUserId } }),
  ]);

  return NextResponse.json({
    following: !!follow,
    followedBy: !!followBack,
    followerCount,
    followingCount,
  });
}
