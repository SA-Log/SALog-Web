import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      nickname: true,
      isProfileComplete: true,
      barracksVerified: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 새 JWT 토큰 생성
  const token = await encode({
    token: {
      sub: dbUser.id,
      id: dbUser.id,
      role: dbUser.role,
      nickname: dbUser.nickname,
      isProfileComplete: dbUser.isProfileComplete,
      barracksVerified: dbUser.barracksVerified,
    },
    secret: process.env.AUTH_SECRET!,
    salt: process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
  });

  // 쿠키에 직접 설정
  const cookieStore = await cookies();
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30일
  });

  return NextResponse.json({
    success: true,
    isProfileComplete: dbUser.isProfileComplete,
  });
}
