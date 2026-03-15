"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
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

function AuthInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isLoggedIn = status === "authenticated" && !!session?.user;

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

  const logout = () => signOut({ callbackUrl: "/", redirect: true });

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
