import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge Runtime에서도 사용 가능한 auth 설정 (Prisma 미포함).
 * 미들웨어에서 사용됩니다.
 */
export const authConfig = {
  providers: [
    Google,
    ...(process.env.AUTH_KAKAO_ID ? [Kakao] : []),
    ...(process.env.AUTH_NAVER_ID ? [Naver] : []),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role ?? "USER";
        token.nickname = user.nickname ?? null;
        token.isProfileComplete = user.isProfileComplete ?? false;
        token.barracksVerified = user.barracksVerified ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.nickname = token.nickname;
      session.user.isProfileComplete = token.isProfileComplete;
      session.user.barracksVerified = token.barracksVerified;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
