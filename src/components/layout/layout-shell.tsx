"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const BARE_ROUTES = ["/signup", "/login"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
