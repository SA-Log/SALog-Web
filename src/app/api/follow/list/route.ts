import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const userId = req.nextUrl.searchParams.get("userId") ?? session.user.id;
  const type = req.nextUrl.searchParams.get("type") ?? "followers"; // "followers" | "following"

  // 다른 유저의 팔로우 목록 조회 시 프라이버시 체크
  if (userId !== session.user.id) {
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { isProfilePublic: true } });
    if (!target?.isProfilePublic) {
      const mutual = await prisma.follow.findFirst({ where: { followerId: userId, followingId: session.user.id } });
      if (!mutual) return NextResponse.json({ users: [] });
    }
  }

  if (type === "followers") {
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        createdAt: true,
        follower: {
          select: {
            id: true,
            nickname: true,
            image: true,
            barracksVerified: true,
          },
        },
      },
    });

    // 내가 이 팔로워들을 팔로우하고 있는지 확인
    const followerIds = followers.map((f) => f.follower.id);
    const myFollowing = await prisma.follow.findMany({
      where: { followerId: session.user.id, followingId: { in: followerIds } },
      select: { followingId: true },
    });
    const myFollowingSet = new Set(myFollowing.map((f) => f.followingId));

    return NextResponse.json({
      users: followers.map((f) => ({
        id: f.follower.id,
        nickname: f.follower.nickname,
        image: f.follower.image,
        barracksVerified: f.follower.barracksVerified,
        followedAt: f.createdAt,
        isFollowingBack: myFollowingSet.has(f.follower.id),
      })),
    });
  }

  // following
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      createdAt: true,
      following: {
        select: {
          id: true,
          nickname: true,
          image: true,
          barracksVerified: true,
        },
      },
    },
  });

  // 이 유저들이 나를 팔로우하고 있는지
  const followingIds = following.map((f) => f.following.id);
  const followBacks = await prisma.follow.findMany({
    where: { followerId: { in: followingIds }, followingId: userId },
    select: { followerId: true },
  });
  const followBackSet = new Set(followBacks.map((f) => f.followerId));

  return NextResponse.json({
    users: following.map((f) => ({
      id: f.following.id,
      nickname: f.following.nickname,
      image: f.following.image,
      barracksVerified: f.following.barracksVerified,
      followedAt: f.createdAt,
      isFollowingBack: followBackSet.has(f.following.id),
    })),
  });
}
