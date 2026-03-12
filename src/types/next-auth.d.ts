import type { UserRole } from "@/generated/prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    nickname?: string | null;
    isProfileComplete?: boolean;
    barracksVerified?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      nickname: string | null;
      isProfileComplete: boolean;
      barracksVerified: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    nickname: string | null;
    isProfileComplete: boolean;
    barracksVerified: boolean;
  }
}
