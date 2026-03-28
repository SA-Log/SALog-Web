import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { checkUserBan } from "@/lib/ban";

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
        token.image = user.image ?? null;
        token.isProfileComplete = user.isProfileComplete ?? false;
        token.barracksVerified = user.barracksVerified ?? false;
      }

      // token.id가 없으면 token.sub에서 가져옴 (NextAuth 기본 필드)
      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      // 세션 업데이트 트리거 또는 프로필 미완성 시 DB에서 최신 정보 조회
      // isProfileComplete가 false이면 매 요청마다 DB 확인 (가입 완료 감지용)
      if (trigger === "update" || token.isProfileComplete === false) {
        const userId = (token.id ?? token.sub) as string | undefined;
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              role: true,
              nickname: true,
              image: true,
              isProfileComplete: true,
              barracksVerified: true,
              deletedAt: true,
            },
          });
          if (dbUser) {
            // 탈퇴한 유저는 세션 무효화
            if (dbUser.deletedAt) {
              return { ...token, isProfileComplete: false, deletedAt: true };
            }
            // 밴 체크
            const banInfo = await checkUserBan(userId!);
            if (banInfo.banned) {
              return { ...token, banned: true, banReason: "서비스 이용이 제한되었습니다", banExpiresAt: banInfo.expiresAt?.toISOString() ?? null };
            }
            token.role = dbUser.role;
            token.nickname = dbUser.nickname;
            token.image = dbUser.image;
            token.isProfileComplete = dbUser.isProfileComplete;
            token.barracksVerified = dbUser.barracksVerified;
          }
        }
      }

      return token;
    },
  },
});
