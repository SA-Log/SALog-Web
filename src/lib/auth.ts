import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

/**
 * 전체 auth 설정 (Prisma adapter 포함).
 * API 라우트, 서버 컴포넌트에서 사용됩니다.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // 기본 콜백 (최초 로그인)
      if (user) {
        token.id = user.id!;
        token.role = user.role ?? "USER";
        token.nickname = user.nickname ?? null;
        token.isProfileComplete = user.isProfileComplete ?? false;
        token.barracksVerified = user.barracksVerified ?? false;
      }

      // 세션 업데이트 트리거 (회원가입 완료 후 등) — DB 접근 필요
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
  },
});
