import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/terms", "/privacy"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 정적 파일, API, _next 등은 무시
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(route + "/"))
  );
  const session = req.auth;

  // 로그인 안 된 상태 → 공개 라우트만 허용
  if (!session) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 로그인 됨 + 프로필 미완성 → /signup으로 리다이렉트
  if (!session.user.isProfileComplete) {
    if (pathname === "/signup" || pathname === "/terms" || pathname === "/privacy") return NextResponse.next();
    return NextResponse.redirect(new URL("/signup", req.url));
  }

  // 프로필 완성된 유저가 /signup 접근 → 홈으로
  if (pathname === "/signup") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 로그인 된 유저가 /login 접근 → 홈으로
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
