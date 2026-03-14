"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { TitleBadge, RankBadge, AccuracyBadge } from "@/components/common/title-badge";
import { AuthGuard } from "@/components/common/auth-guard";
import {
  mockUsers,
  mockHackReports,
  reportToActivity,
  mockFollowing,
  mockFollowers,
  getExpProgress,
  getAccuracyColor,
  formatRelativeTime,
  HACK_STATUS_MAP,
  ROLE_MAP,
  type Activity,
  type FollowUser,
} from "@/lib/mock-data";

type ProfileTab = "activity" | "following" | "followers";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const userId = params.id as string;

  // 자기 프로필이면 /profile로 리다이렉트
  useEffect(() => {
    if (authUser?.id && authUser.id === userId) {
      router.replace("/profile");
    }
  }, [authUser?.id, userId, router]);

  const user = mockUsers.find((u) => u.id === userId);

  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");
  const [isFollowing, setIsFollowing] = useState(
    mockFollowing.some((f) => f.id === userId)
  );

  // 비공개 프로필 체크: 크리에이터는 무조건 공개, 그 외 mock으로 u3/u5 비공개
  const isCreatorUser = user?.role === "VERIFIED_CREATOR";
  const isUserPrivate = (() => {
    if (!user || isCreatorUser) return false; // 크리에이터는 항상 공개
    if (userId === "u3" || userId === "u5") return true;
    return false;
  })();
  const canViewContent = !isUserPrivate || isFollowing;

  // Mock 유저가 없으면 DB에서 조회
  if (!user) {
    return <DbProfileView userId={userId} />;
  }

  const { progress, next } = getExpProgress(user.exp);

  // 해당 유저가 등록한 게시글만 활동으로 표시
  const activities = mockHackReports
    .filter((r) => r.reporterId === userId)
    .map((r) => reportToActivity(r, "a"));

  // Build follow lists for this user (demo: reuse mock data filtered)
  const userFollowing = mockFollowing.filter((f) => f.id !== userId);
  const userFollowers = mockFollowers.filter((f) => f.id !== userId);

  const tabs: { value: ProfileTab; label: string; count: number }[] = [
    { value: "activity", label: "활동", count: activities.length },
    { value: "following", label: "팔로잉", count: userFollowing.length },
    { value: "followers", label: "팔로워", count: userFollowers.length },
  ];

  return (
    <AuthGuard>
    <div className="mx-auto max-w-screen-lg px-5 py-6">
      {/* Profile Header */}
      {(() => {
        const roleInfo = ROLE_MAP[user.role];
        const isCreator = user.role === "VERIFIED_CREATOR";
        const isStaff = user.role === "MASTER" || user.role === "VICE_MASTER" || user.role === "OPERATOR";
        const isSpecialRole = isCreator || isStaff;

        return (
      <div className={`bg-card rounded-2xl border shadow-toss overflow-hidden ${
        isSpecialRole ? `border-${roleInfo.color.replace("text-", "")}/30` : "border-border/50"
      }`}>
        {/* Special Role Banner */}
        {isSpecialRole && (
          <div className={`px-5 py-2.5 ${roleInfo.bg} border-b border-border/30 flex items-center gap-2`}>
            <span className={`text-[12px] font-bold ${roleInfo.color}`}>{roleInfo.label}</span>
            {isStaff && <span className="text-[11px] text-toss-gray-500">SALog 운영팀</span>}
            {isCreator && <span className="text-[11px] text-toss-gray-500">공식 인증 크리에이터</span>}
          </div>
        )}
        {/* Avatar + Info */}
        <div className="px-5 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-card border-4 border-card shadow-toss-md flex items-center justify-center shrink-0">
              <span className="text-[28px] sm:text-[32px] font-bold text-primary">{user.name.charAt(0)}</span>
            </div>

            {/* Name + Badges */}
            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[20px] sm:text-[22px] font-bold text-foreground truncate">{user.name}</h1>
                {/* 병영수첩 연동 체크마크 */}
                {user.barracksAddress && (
                  <div className="w-5 h-5 rounded-full bg-toss-green flex items-center justify-center shrink-0" title="병영수첩 인증됨">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 6.5l2 2 4-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                {/* 역할 뱃지 (일반 유저 제외) */}
                {user.role !== "USER" && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${roleInfo.bg} ${roleInfo.color}`}>{roleInfo.label}</span>
                )}
                <RankBadge rank={user.rank} size="md" />
                <TitleBadge title={user.title} size="md" />
                {isUserPrivate && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-500">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="2" y="5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1"/><path d="M3 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                    비공개
                  </span>
                )}
              </div>
              <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mt-1">
                {user.joinedAt && `${new Date(user.joinedAt).toLocaleDateString("ko-KR")} 가입`}
              </p>
              {user.barracksAddress && (
                <a
                  href={user.barracksAddress}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-primary hover:text-primary/80 transition-colors mt-1"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 1H2.5C1.67 1 1 1.67 1 2.5V9.5C1 10.33 1.67 11 2.5 11H9.5C10.33 11 11 10.33 11 9.5V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M7 1H11V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 1L5.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  병영수첩 바로가기
                </a>
              )}
              {/* 크리에이터 링크 */}
              {isCreator && (user.youtubeUrl || user.broadcastUrl || (user.otherLinks && user.otherLinks.length > 0)) && (
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {user.youtubeUrl && (
                    <a href={user.youtubeUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-toss-red hover:underline">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1"/><path d="M5 5v2.5l2.5-1.25L5 5z" fill="currentColor"/></svg>
                      유튜브
                    </a>
                  )}
                  {user.broadcastUrl && (
                    <a href={user.broadcastUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-toss-green hover:underline">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1"/><path d="M4 6l1.5 1.5L8 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      방송국
                    </a>
                  )}
                  {user.otherLinks?.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1H2.5C1.67 1 1 1.67 1 2.5v5C1 8.33 1.67 9 2.5 9h5C8.33 9 9 8.33 9 7.5V5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><path d="M6 1h3v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 1L5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Follow button */}
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`shrink-0 h-9 px-5 rounded-xl text-[13px] font-semibold self-start sm:self-auto ${
                isFollowing
                  ? "bg-secondary text-toss-gray-600 border border-border btn-secondary"
                  : "bg-primary text-white btn-primary"
              }`}
            >
              {isFollowing ? "팔로잉" : "팔로우"}
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-5 pt-5 border-t border-border/50">
            <div className="text-center">
              <p className={`text-[16px] sm:text-[20px] font-bold ${getAccuracyColor(user.accuracy)}`}>{user.accuracy}%</p>
              <p className="text-[10px] sm:text-[11px] text-toss-gray-500 mt-0.5">명중률</p>
            </div>
            <div className="text-center">
              <p className="text-[16px] sm:text-[20px] font-bold text-foreground">{user.totalReports}</p>
              <p className="text-[10px] sm:text-[11px] text-toss-gray-500 mt-0.5">신고</p>
            </div>
            <div className="text-center">
              <p className="text-[16px] sm:text-[20px] font-bold text-foreground">{userFollowers.length}</p>
              <p className="text-[10px] sm:text-[11px] text-toss-gray-500 mt-0.5">팔로워</p>
            </div>
            <div className="text-center">
              <p className="text-[16px] sm:text-[20px] font-bold text-foreground">{userFollowing.length}</p>
              <p className="text-[10px] sm:text-[11px] text-toss-gray-500 mt-0.5">팔로잉</p>
            </div>
          </div>

          {/* K/D/A + EXP compact */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-toss-red font-semibold">{user.kills}K</span>
              <span className="text-toss-gray-300">/</span>
              <span className="text-toss-blue font-semibold">{user.deaths}D</span>
              <span className="text-toss-gray-300">/</span>
              <span className="text-toss-green font-semibold">{user.assists}A</span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[120px]">
              <span className="text-toss-gray-500">{user.exp.toLocaleString()} EXP</span>
              <div className="flex-1 h-1.5 rounded-full bg-toss-gray-100 dark:bg-toss-gray-200 overflow-hidden max-w-[100px]">
                <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
              {next && <span className="text-toss-gray-400 text-[11px]">{next.name}까지</span>}
            </div>
            {user.streak >= 3 && (
              <span className="text-toss-orange font-medium">🔥 {user.streak}일 연속 출석</span>
            )}
          </div>
        </div>
      </div>
        );
      })()}

      {/* Tabs */}
      {canViewContent ? (
        <>
          <div className="flex gap-1 mt-5 mb-5 bg-secondary rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium btn-chip ${
                  activeTab === tab.value
                    ? "bg-card text-foreground shadow-toss"
                    : "text-toss-gray-500"
                }`}
              >
                {tab.label}
                <span className={`ml-1 text-[11px] ${activeTab === tab.value ? "text-primary" : "text-toss-gray-400"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "activity" && <ActivityFeed activities={activities} />}
          {activeTab === "following" && <FollowSection users={userFollowing} type="following" />}
          {activeTab === "followers" && <FollowSection users={userFollowers} type="followers" />}
        </>
      ) : (
        <div className="mt-5 bg-card rounded-2xl border border-border/50 shadow-toss p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-700 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
              <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-foreground mb-1">비공개 프로필</p>
          <p className="text-[13px] text-toss-gray-500 leading-relaxed">
            이 유저의 활동, 팔로잉, 팔로워 정보는 비공개입니다.<br />
            팔로우하면 모든 정보를 볼 수 있습니다.
          </p>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}

// ==================== Activity Feed (Instagram Grid) ====================

function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <div>
      <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mb-4">
        신고 활동 <span className="font-semibold text-foreground">{activities.length}</span>건
      </p>

      {/* Instagram-style Grid */}
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <span className="text-[20px]">🎯</span>
          </div>
          <p className="text-[15px] text-foreground font-semibold">아직 신고 활동이 없습니다</p>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <Link
      href={`/reports/${activity.targetId}`}
      className="group relative aspect-square bg-card rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden shadow-toss hover:shadow-toss-md transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Background pattern */}
      <div className={`absolute inset-0 ${activity.thumbnailColor}`} />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-2.5 sm:p-3.5">
        {/* Top: Type badge */}
        <div className="flex items-center justify-between">
          <span className="text-[16px] sm:text-[20px]">🎯</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${HACK_STATUS_MAP[activity.hackStatus].bg} ${HACK_STATUS_MAP[activity.hackStatus].color}`}>
            {HACK_STATUS_MAP[activity.hackStatus].label}
          </span>
        </div>

        {/* Bottom: Info */}
        <div>
          <p className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate">{activity.targetNickname}</p>
          <p className="text-[10px] sm:text-[11px] text-toss-gray-500 truncate mt-0.5">신고</p>
          <p className="text-[9px] sm:text-[10px] text-toss-gray-400 mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors duration-200 rounded-xl sm:rounded-2xl" />
    </Link>
  );
}

// ==================== Follow Section ====================

function FollowSection({ users, type }: { users: FollowUser[]; type: "following" | "followers" }) {
  const [followState, setFollowState] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    users.forEach((u) => {
      state[u.id] = type === "following" ? true : u.isFollowingBack;
    });
    return state;
  });

  function toggleFollow(userId: string) {
    setFollowState((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500">
          {type === "following" ? "팔로우하는 유저" : "팔로워"}
        </p>
        <span className="text-[12px] text-toss-gray-400">{users.length}명</span>
      </div>

      <div className="flex flex-col gap-2">
        {users.map((user) => {
          const isFollowing = followState[user.id] ?? false;
          return (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="bg-card rounded-2xl border border-border/50 shadow-toss p-4 hover:shadow-toss-md transition-toss block"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-toss-gray-200 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-bold text-toss-gray-500">{user.name.charAt(0)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[14px] font-semibold text-foreground truncate">{user.name}</span>
                    <RankBadge rank={user.rank} />
                    <TitleBadge title={user.title} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[12px]">
                    <AccuracyBadge accuracy={user.accuracy} kills={user.kills} deaths={user.deaths} />
                    <span className="text-toss-gray-400">{user.exp.toLocaleString()} EXP</span>
                  </div>
                </div>

                {/* Follow button */}
                <button
                  onClick={(e) => { e.preventDefault(); toggleFollow(user.id); }}
                  className={`shrink-0 h-8 px-4 rounded-xl text-[12px] font-semibold ${
                    isFollowing
                      ? "bg-secondary text-toss-gray-600 border border-border btn-secondary"
                      : "bg-primary text-white btn-primary"
                  }`}
                >
                  {isFollowing ? "팔로잉" : "팔로우"}
                </button>
              </div>

              {/* Mutual badge */}
              {user.isFollowingBack && (
                <div className="mt-2 ml-14">
                  <span className="text-[11px] text-primary font-medium">서로 팔로우 중</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 10C12.21 10 14 8.21 14 6C14 3.79 12.21 2 10 2C7.79 2 6 3.79 6 6C6 8.21 7.79 10 10 10Z" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
              <path d="M3 18C3 14.134 6.134 11 10 11C13.866 11 17 14.134 17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
            </svg>
          </div>
          <p className="text-[15px] text-foreground font-semibold">
            {type === "following" ? "팔로우하는 유저가 없습니다" : "팔로워가 없습니다"}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── DB Profile View (실제 유저) ───

interface DbProfile {
  id: string;
  nickname: string | null;
  image: string | null;
  role: string;
  isPrivate: boolean;
  isProfilePublic?: boolean;
  barracksAddress?: string | null;
  createdAt?: string;
  reportCount?: number;
  recentReports?: {
    id: string;
    nickname: string;
    status: string;
    hackTypes: string[];
    createdAt: string;
  }[];
  isOwn?: boolean;
}

const DB_STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  SUSPECT: { label: "핵 의심", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
  PROBABLE: { label: "핵 유력", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20" },
  CONFIRMED: { label: "핵 확정", color: "text-white", bg: "bg-toss-red" },
  DISMISSED: { label: "기각", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
};

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function DbProfileView({ userId }: { userId: string }) {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then((res) => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then((data) => { if (data) setProfile(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-screen-md px-5 py-8">
          <div className="bg-card rounded-3xl border border-border/40 shadow-toss overflow-hidden">
            <div className="px-6 pt-6 pb-5 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse mb-4" />
              <div className="h-6 w-32 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse mb-2" />
              <div className="h-4 w-24 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />
            </div>
            <div className="border-t border-border/30">
              <div className="grid grid-cols-3 divide-x divide-border/30">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-4 flex flex-col items-center gap-1.5">
                    <div className="h-5 w-8 rounded bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />
                    <div className="h-3 w-10 rounded bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (notFound || !profile) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-screen-md px-5 py-8">
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-full bg-toss-gray-50 dark:bg-secondary flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-toss-gray-300">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 20C5 16.134 8.134 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[15px] text-foreground font-semibold">존재하지 않는 유저입니다</p>
            <Link href="/" className="text-[13px] text-primary mt-2 inline-block">홈으로 돌아가기</Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const isOwn = authUser?.id === profile.id;
  const roleLabel = profile.role === "MASTER" ? "마스터" : profile.role === "VICE_MASTER" ? "부마스터" : profile.role === "OPERATOR" ? "운영자" : profile.role === "VERIFIED_CREATOR" ? "인증 크리에이터" : null;
  const isStaff = profile.role === "MASTER" || profile.role === "VICE_MASTER" || profile.role === "OPERATOR";
  const isCreator = profile.role === "VERIFIED_CREATOR";
  const isSpecialRole = isStaff || isCreator;

  return (
    <AuthGuard>
      <div className="mx-auto max-w-screen-md px-5 py-8">

        {/* ─── Hero Card (matches /profile design) ─── */}
        <div className="bg-card rounded-3xl border border-border/40 shadow-toss overflow-hidden">

          {/* Role Banner */}
          {isSpecialRole && (
            <div className={`px-6 py-2 ${isCreator ? "bg-purple-50 dark:bg-purple-500/10" : "bg-primary/5 dark:bg-primary/10"} flex items-center gap-2`}>
              <span className={`text-[11px] font-bold tracking-wide uppercase ${isCreator ? "text-purple-600 dark:text-purple-400" : "text-primary"}`}>
                {roleLabel}
              </span>
              <span className="text-[11px] text-toss-gray-500">
                {isStaff ? "SALog 운영팀" : "공식 인증 크리에이터"}
              </span>
            </div>
          )}

          {/* Profile Identity — centered */}
          <div className="px-6 pt-6 pb-5 flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-secondary ring-4 ring-card shadow-toss-md flex items-center justify-center overflow-hidden">
                {profile.image ? (
                  <img src={profile.image} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[34px] font-bold text-primary/80">
                    {(profile.nickname || "?").charAt(0)}
                  </span>
                )}
              </div>
              {/* 병영수첩 인증 마크 */}
              {profile.barracksAddress && (
                <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-primary ring-[3px] ring-card flex items-center justify-center" title="병영수첩 인증됨">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Name row */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <h1 className="text-[22px] font-bold tracking-tight text-foreground">
                {profile.nickname || "익명"}
              </h1>
              {roleLabel && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isCreator ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : "bg-primary/10 text-primary"
                }`}>
                  {roleLabel}
                </span>
              )}
              {profile.isPrivate && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-500">
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><rect x="2" y="5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M3 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  비공개
                </span>
              )}
            </div>

            {/* Join date */}
            {profile.createdAt && (
              <p className="text-[13px] text-toss-gray-500 mt-1.5">
                {formatDateShort(profile.createdAt)} 가입
              </p>
            )}

            {/* 병영수첩 바로가기 */}
            {profile.barracksAddress && (
              <a
                href={profile.barracksAddress}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] text-primary hover:text-primary/80 transition-colors mt-2"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 1H2.5C1.67 1 1 1.67 1 2.5V9.5C1 10.33 1.67 11 2.5 11H9.5C10.33 11 11 10.33 11 9.5V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M7 1H11V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 1L5.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                병영수첩 바로가기
              </a>
            )}

            {/* Action button */}
            {isOwn && (
              <Link
                href="/profile"
                className="mt-4 h-9 px-5 rounded-full bg-secondary text-[12px] font-semibold text-foreground border border-border/60 transition-all hover:bg-secondary/80 active:scale-[0.97] inline-flex items-center"
              >
                내 프로필로 이동
              </Link>
            )}
          </div>

          {/* ─── Stats Grid ─── */}
          {!profile.isPrivate && (
            <div className="border-t border-border/30">
              <div className="grid grid-cols-3 divide-x divide-border/30">
                <div className="py-4 text-center">
                  <p className="text-[18px] sm:text-[20px] font-bold tabular-nums text-foreground">{profile.reportCount ?? 0}</p>
                  <p className="text-[10px] sm:text-[11px] text-toss-gray-400 mt-0.5 tracking-wide">신고</p>
                </div>
                <div className="py-4 text-center">
                  <p className="text-[18px] sm:text-[20px] font-bold tabular-nums text-foreground">0</p>
                  <p className="text-[10px] sm:text-[11px] text-toss-gray-400 mt-0.5 tracking-wide">팔로워</p>
                </div>
                <div className="py-4 text-center">
                  <p className="text-[18px] sm:text-[20px] font-bold tabular-nums text-foreground">0</p>
                  <p className="text-[10px] sm:text-[11px] text-toss-gray-400 mt-0.5 tracking-wide">팔로잉</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Private notice ─── */}
        {profile.isPrivate && (
          <div className="mt-6 bg-card rounded-3xl border border-border/40 shadow-toss p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-toss-gray-50 dark:bg-secondary flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
                <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">비공개 프로필</p>
            <p className="text-[13px] text-toss-gray-500 leading-relaxed">
              이 유저의 활동 정보는 비공개입니다.
            </p>
          </div>
        )}

        {/* ─── Recent reports ─── */}
        {!profile.isPrivate && profile.recentReports && profile.recentReports.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-1 border-b border-border/40 pb-3">
              <span className="text-[13px] font-medium text-foreground">최근 신고</span>
              <span className="text-[12px] text-toss-gray-400 tabular-nums">{profile.recentReports.length}건</span>
            </div>

            {/* Grid style like activity feed */}
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 mt-3">
              {profile.recentReports.map((r) => {
                const status = DB_STATUS_STYLE[r.status] || DB_STATUS_STYLE.SUSPECT;
                return (
                  <Link
                    key={r.id}
                    href={`/reports/${r.id}`}
                    className="group relative aspect-square bg-card rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden shadow-toss hover:shadow-toss-md transition-all duration-200 hover:-translate-y-0.5"
                  >
                    {/* Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-toss-red/5 to-toss-red/10 dark:from-toss-red/10 dark:to-toss-red/5" />

                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-between p-2.5 sm:p-3.5">
                      {/* Top */}
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] sm:text-[20px]">🎯</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Bottom */}
                      <div>
                        <p className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate">{r.nickname}</p>
                        <p className="text-[10px] sm:text-[11px] text-toss-gray-500 truncate mt-0.5">신고</p>
                        <p className="text-[9px] sm:text-[10px] text-toss-gray-400 mt-0.5">{formatDateShort(r.createdAt)}</p>
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors duration-200 rounded-xl sm:rounded-2xl" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* No reports */}
        {!profile.isPrivate && (!profile.recentReports || profile.recentReports.length === 0) && (
          <div className="mt-6 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-toss-gray-50 dark:bg-secondary flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-toss-gray-300">
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-foreground">아직 신고 활동이 없습니다</p>
            <p className="text-[13px] text-toss-gray-400 mt-1">핵 유저를 발견하면 신고해주세요</p>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
