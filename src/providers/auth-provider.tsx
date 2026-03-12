"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";

interface AuthUser {
  id: string;
  name: string;
  image: string | null;
  role: UserRole;
  nickname: string | null;
  isProfileComplete: boolean;
  barracksVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const SIGNUP_EXEMPT = ["/signup", "/login", "/terms", "/privacy"];

function AuthInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLoading = status === "loading";
  const isLoggedIn = status === "authenticated" && !!session?.user;

  // 프로필 미완성 유저 → /signup 리다이렉트 (클라이언트 측)
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (session.user.isProfileComplete) return;
    if (SIGNUP_EXEMPT.some((r) => pathname === r || pathname.startsWith(r + "/"))) return;
    router.replace("/signup");
  }, [status, session, pathname, router]);

  const user: AuthUser | null =
    isLoggedIn && session?.user
      ? {
          id: session.user.id,
          name: session.user.nickname ?? session.user.name ?? "유저",
          image: session.user.image ?? null,
          role: session.user.role ?? "USER",
          nickname: session.user.nickname ?? null,
          isProfileComplete: session.user.isProfileComplete ?? false,
          barracksVerified: session.user.barracksVerified ?? false,
        }
      : null;

  const logout = () => signOut({ callbackUrl: "/" });

  return (
    <AuthContext.Provider value={{ user, isLoading, isLoggedIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthInner>{children}</AuthInner>
    </SessionProvider>
  );
}
