import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/terms", "/privacy", "/banned"];

// 비로그인 조회 가능 라우트 (읽기 전용)
const VIEWABLE_ROUTES = ["/reports", "/manner", "/search", "/ranking", "/profile"];

// 악성 봇 User-Agent 패턴 (robots.txt 무시하는 봇 대응)
const BLOCKED_BOTS = /meta-externalagent|facebookexternalhit|FacebookBot|GPTBot|ChatGPT-User|CCBot|ClaudeBot|anthropic-ai|PerplexityBot|Amazonbot|Bytespider|AhrefsBot|SemrushBot|MJ12bot|DotBot|PetalBot|BLEXBot/i;

export async function proxy(req: NextRequest) {
  // auth() wraps the request and attaches session
  const res = await auth(async (authReq) => {
    const { pathname } = authReq.nextUrl;

    // 봇 차단 — 서버리스 함수 비용 보호
    const ua = authReq.headers.get("user-agent") ?? "";
    if (BLOCKED_BOTS.test(ua)) {
      return new NextResponse("Blocked", { status: 403 });
    }

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
    const session = authReq.auth;

    // 조회 가능 라우트 체크
    const isViewable = VIEWABLE_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    // 로그인 안 된 상태 → 공개/조회 라우트만 허용
    if (!session) {
      if (isPublic || isViewable) return NextResponse.next();
      return NextResponse.redirect(new URL("/login", authReq.url));
    }

    // 밴된 유저 → /banned로 리다이렉트
    if ((session as unknown as Record<string, unknown>).banned) {
      if (pathname === "/banned") return NextResponse.next();
      return NextResponse.redirect(new URL("/banned", authReq.url));
    }

    // 로그인 됨 + 프로필 미완성 → /signup으로 리다이렉트
    if (!session.user.isProfileComplete) {
      if (pathname === "/signup" || pathname === "/terms" || pathname === "/privacy") return NextResponse.next();
      return NextResponse.redirect(new URL("/signup", authReq.url));
    }

    // 프로필 완성된 유저가 /signup 접근 → 홈으로
    if (pathname === "/signup") {
      return NextResponse.redirect(new URL("/", authReq.url));
    }

    // 로그인 된 유저가 /login 접근 → 홈으로
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", authReq.url));
    }

    return NextResponse.next();
  })(req, {} as never);

  // 보안 헤더 추가
  if (res) {
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
