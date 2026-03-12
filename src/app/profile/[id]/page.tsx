"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  const userId = params.id as string;
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

  if (!user) {
    return (
      <div className="mx-auto max-w-screen-lg px-5 py-6">
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
              <path d="M5 20C5 16.134 8.134 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
            </svg>
          </div>
          <p className="text-[15px] text-foreground font-semibold">존재하지 않는 유저입니다</p>
          <Link href="/" className="text-[13px] text-primary mt-2 inline-block">홈으로 돌아가기</Link>
        </div>
      </div>
    );
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
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-border/50">
            <div className="text-center">
              <p className={`text-[20px] font-bold ${getAccuracyColor(user.accuracy)}`}>{user.accuracy}%</p>
              <p className="text-[11px] text-toss-gray-500 mt-0.5">명중률</p>
            </div>
            <div className="text-center">
              <p className="text-[20px] font-bold text-foreground">{user.totalReports}</p>
              <p className="text-[11px] text-toss-gray-500 mt-0.5">신고</p>
            </div>
            <div className="text-center">
              <p className="text-[20px] font-bold text-foreground">{userFollowers.length}</p>
              <p className="text-[11px] text-toss-gray-500 mt-0.5">팔로워</p>
            </div>
            <div className="text-center">
              <p className="text-[20px] font-bold text-foreground">{userFollowing.length}</p>
              <p className="text-[11px] text-toss-gray-500 mt-0.5">팔로잉</p>
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
