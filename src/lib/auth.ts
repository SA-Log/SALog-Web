import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    ...(process.env.AUTH_KAKAO_ID ? [Kakao] : []),
    ...(process.env.AUTH_NAVER_ID ? [Naver] : []),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // 최초 로그인 시 DB 데이터 주입
      if (user) {
        token.id = user.id!;
        token.role = user.role ?? "USER";
        token.nickname = user.nickname ?? null;
        token.isProfileComplete = user.isProfileComplete ?? false;
        token.barracksVerified = user.barracksVerified ?? false;
      }

      // 세션 업데이트 트리거 (회원가입 완료 후 등)
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            role: true,
            nickname: true,
            isProfileComplete: true,
            barracksVerified: true,
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.nickname = dbUser.nickname;
          token.isProfileComplete = dbUser.isProfileComplete;
          token.barracksVerified = dbUser.barracksVerified;
        }
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
});
