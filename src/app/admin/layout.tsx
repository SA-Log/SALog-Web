"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLE_MAP, type UserRole } from "@/lib/mock-data";
import { useAuth } from "@/providers/auth-provider";

// 역할 테스트용 Context — 전역에서 사용 가능
const RoleContext = createContext<{ role: UserRole; setRole: (r: UserRole) => void }>({
  role: "USER",
  setRole: () => {},
});

export function useAdminRole() {
  return useContext(RoleContext);
}

function getStoredRole(fallback: UserRole): UserRole {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem("salog_test_role");
  if (stored && Object.keys(ROLE_MAP).includes(stored)) return stored as UserRole;
  return fallback;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "대시보드",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
    roles: ["MASTER", "VICE_MASTER", "OPERATOR"],
  },
  {
    href: "/admin/reports",
    label: "신고 관리",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    roles: ["MASTER", "VICE_MASTER", "OPERATOR"],
  },
  {
    href: "/admin/users",
    label: "유저 관리",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197",
    roles: ["MASTER", "VICE_MASTER", "OPERATOR"],
  },
  {
    href: "/admin/bans",
    label: "유저 제재",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    roles: ["MASTER", "VICE_MASTER", "OPERATOR"],
  },
  {
    href: "/admin/applications",
    label: "크리에이터 심사",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    roles: ["MASTER"],
  },
  {
    href: "/admin/logs",
    label: "관리 로그",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    roles: ["MASTER", "VICE_MASTER", "OPERATOR"],
  },
];

const TESTABLE_ROLES: UserRole[] = ["MASTER", "VICE_MASTER", "OPERATOR", "VERIFIED_CREATOR", "USER"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const userRole = (authUser?.role ?? "USER") as UserRole;
  const userName = authUser?.nickname ?? authUser?.name ?? "유저";

  const [testRole, setTestRole] = useState<UserRole>(() => getStoredRole(userRole));
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const pathname = usePathname();

  // 실제 역할이 변경되면 테스트 역할도 동기화
  useEffect(() => {
    if (userRole !== "USER") {
      const stored = getStoredRole(userRole);
      // 저장된 테스트 역할이 없거나, 실제 역할이 변경됐을 때 동기화
      if (!localStorage.getItem("salog_test_role")) {
        setTestRole(userRole);
      }
    }
  }, [userRole]);

  // localStorage에 역할 테스트 상태 저장
  useEffect(() => {
    localStorage.setItem("salog_test_role", testRole);
  }, [testRole]);

  const currentRole = testRole;
  const isMasterUser = userRole === "MASTER"; // 실제 역할이 마스터인 경우에만 역할 테스트 가능
  const isAdmin = currentRole === "MASTER" || currentRole === "VICE_MASTER" || currentRole === "OPERATOR";
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(currentRole));
  const roleInfo = ROLE_MAP[currentRole];

  // 관리자가 아닌 역할은 접근 불가
  if (!isAdmin) {
    return (
      <RoleContext.Provider value={{ role: currentRole, setRole: setTestRole }}>
        <div className="mx-auto max-w-screen-xl px-5 py-6">
          {/* Role switcher — 마스터만 */}
          {isMasterUser && <RoleSwitcher testRole={testRole} setTestRole={setTestRole} showRoleSwitcher={showRoleSwitcher} setShowRoleSwitcher={setShowRoleSwitcher} />}

          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-toss-red/10 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15v2m0-6v.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" stroke="#f04452" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[16px] font-bold text-foreground mb-1">접근 권한이 없습니다</p>
            <p className="text-[13px] text-toss-gray-500 mb-1">관리자 페이지는 운영진 이상만 접근할 수 있습니다.</p>
            <p className="text-[12px] text-toss-gray-400">
              현재 역할: <span className={`font-semibold ${ROLE_MAP[currentRole].color}`}>{ROLE_MAP[currentRole].label}</span>
            </p>
            <Link href="/" className="inline-flex h-10 px-6 rounded-xl bg-primary text-white text-[14px] font-semibold items-center btn-primary mt-6">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </RoleContext.Provider>
    );
  }

  return (
    <RoleContext.Provider value={{ role: currentRole, setRole: setTestRole }}>
      <div className="mx-auto max-w-screen-xl px-5 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            {/* Role switcher — 마스터만 */}
            {isMasterUser && <RoleSwitcher testRole={testRole} setTestRole={setTestRole} showRoleSwitcher={showRoleSwitcher} setShowRoleSwitcher={setShowRoleSwitcher} />}

            <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-[14px] font-bold text-primary">{userName.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{userName}</p>
                  <span className={`text-[11px] font-semibold ${roleInfo.color}`}>{roleInfo.label}</span>
                </div>
              </div>
            </div>

            <nav className="bg-card rounded-2xl border border-border/50 shadow-toss overflow-hidden">
              {visibleNav.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 text-[13px] font-medium transition-toss border-b border-border/30 last:border-b-0 ${
                      isActive ? "bg-primary/5 text-primary" : "text-toss-gray-600 dark:text-toss-gray-400 hover:bg-secondary"
                    }`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <path d={item.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* 역할별 권한 안내 */}
            <div className="mt-4 bg-card rounded-2xl border border-border/50 shadow-toss p-4">
              <p className="text-[11px] font-semibold text-toss-gray-500 uppercase tracking-wide mb-2">내 권한</p>
              <div className="space-y-1.5">
                {currentRole === "MASTER" && (
                  <>
                    <PermItem text="모든 관리 기능" />
                    <PermItem text="핵 확정 / 유력 / 기각" />
                    <PermItem text="역할 변경" />
                    <PermItem text="크리에이터 심사" />
                    <PermItem text="유저 제재" />
                  </>
                )}
                {currentRole === "VICE_MASTER" && (
                  <>
                    <PermItem text="핵 확정 / 유력 / 기각" />
                    <PermItem text="유저 제재" />
                    <PermItem text="관리 로그 열람" />
                    <PermDenied text="역할 변경 불가" />
                    <PermDenied text="크리에이터 심사 불가" />
                  </>
                )}
                {currentRole === "OPERATOR" && (
                  <>
                    <PermItem text="핵 유력 / 기각 처리" />
                    <PermApproval text="핵 확정 (승인 필요)" />
                    <PermApproval text="유저 제재 (승인 필요)" />
                    <PermItem text="관리 로그 열람" />
                    <PermDenied text="역할 변경 불가" />
                    <PermDenied text="크리에이터 심사 불가" />
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </RoleContext.Provider>
  );
}

function PermItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-toss-gray-600 dark:text-toss-gray-400">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-toss-green shrink-0">
        <path d="M3 6.5l2 2 4-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {text}
    </div>
  );
}

function PermApproval({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-amber-500 shrink-0">
        <path d="M6 3v3M6 8h.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
      {text}
    </div>
  );
}

function PermDenied({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-toss-gray-400">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-toss-gray-400 shrink-0">
        <path d="M3.5 3.5l5 5M8.5 3.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      {text}
    </div>
  );
}

function RoleSwitcher({
  testRole, setTestRole, showRoleSwitcher, setShowRoleSwitcher,
}: {
  testRole: UserRole;
  setTestRole: (r: UserRole) => void;
  showRoleSwitcher: boolean;
  setShowRoleSwitcher: (v: boolean) => void;
}) {
  const roleInfo = ROLE_MAP[testRole];
  return (
    <div className="mb-4">
      <button onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-toss">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="flex-1 text-left">역할 테스트: <span className={`font-bold ${roleInfo.color}`}>{roleInfo.label}</span></span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${showRoleSwitcher ? "rotate-180" : ""}`}>
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {showRoleSwitcher && (
        <div className="mt-2 bg-card border border-border/50 rounded-xl p-2 shadow-toss flex flex-wrap gap-1.5">
          {TESTABLE_ROLES.map((role) => {
            const info = ROLE_MAP[role];
            const isActive = testRole === role;
            return (
              <button key={role} onClick={() => { setTestRole(role); setShowRoleSwitcher(false); }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-toss ${
                  isActive ? `${info.bg} ${info.color} font-bold` : "bg-secondary text-toss-gray-500 hover:bg-toss-gray-200 dark:hover:bg-toss-gray-700"
                }`}>
                {info.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
