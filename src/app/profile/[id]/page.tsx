"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { TitleBadge, RankBadge } from "@/components/common/title-badge";
import { LoginPrompt } from "@/components/common/login-prompt";
import {
  getExpProgress,
  getAccuracyColor,
  getTitleForAccuracy,
  getRankForExp,
  ROLE_MAP,
  type UserRole,
} from "@/lib/mock-data";

type ProfileTab = "activity" | "blacklist" | "following" | "followers";

interface UserProfile {
  id: string;
  nickname: string | null;
  image: string | null;
  role: UserRole;
  bio: string | null;
  isProfilePublic: boolean;
  barracksAddress: string | null;
  barracksVerified: boolean;
  createdAt: string;
  reportCount: number;
  recentReports: {
    id: string;
    nickname: string;
    status: string;
    hackTypes: string[];
    createdAt: string;
  }[];
  isOwn: boolean;
  isPrivate: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isLoggedIn } = useAuth();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBy, setIsFollowedBy] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [liveFollowerCount, setLiveFollowerCount] = useState(0);
  const [liveFollowingCount, setLiveFollowingCount] = useState(0);

  // 자기 프로필이면 /profile로 리다이렉트
  useEffect(() => {
    if (authUser?.id && authUser.id === userId) {
      router.replace("/profile");
    }
  }, [authUser?.id, userId, router]);

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then((res) => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setProfile(data);
          setLiveFollowerCount(data.followerCount ?? 0);
          setLiveFollowingCount(data.followingCount ?? 0);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    // 팔로우 상태 조회
    fetch(`/api/follow?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setIsFollowing(data.following ?? false);
        setIsFollowedBy(data.followedBy ?? false);
      })
      .catch(() => {});
  }, [userId]);

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  async function handleFollow() {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    setFollowLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.following);
        setLiveFollowerCount((c) => data.following ? c + 1 : c - 1);
      }
    } catch { /* ignore */ }
    finally { setFollowLoading(false); }
  }

  if (loading) {
    return (
      
        <div className="mx-auto max-w-screen-md px-5 py-8">
          <div className="bg-card rounded-3xl border border-border/40 shadow-toss overflow-hidden">
            <div className="px-6 pt-6 pb-5 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse mb-4" />
              <div className="h-6 w-32 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse mb-2" />
              <div className="h-4 w-24 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />
            </div>
          </div>
        </div>
      
    );
  }

  if (notFound || !profile) {
    return (
      
        <div className="mx-auto max-w-screen-md px-5 py-8 text-center py-20">
          <div className="w-14 h-14 rounded-full bg-toss-gray-50 dark:bg-secondary flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-toss-gray-300">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 20C5 16.134 8.134 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[15px] text-foreground font-semibold">존재하지 않는 유저입니다</p>
          <Link href="/" className="text-[13px] text-primary mt-2 inline-block">홈으로 돌아가기</Link>
        </div>
      
    );
  }

  const name = profile.nickname ?? "유저";
  const role = profile.role;
  const roleInfo = ROLE_MAP[role] ?? ROLE_MAP.USER;
  const hasBarracks = profile.barracksVerified;
  const barracksUrl = profile.barracksAddress
    ? `https://barracks.sa.nexon.com/${profile.barracksAddress}/match`
    : null;

  // 임시 값 (추후 DB 연동)
  const kills = 0, deaths = 0, assists = 0, exp = 0, accuracy = 0;
  const totalReports = profile.reportCount ?? 0;
  const followerCount = liveFollowerCount;
  const followingCount = liveFollowingCount;
  const rank = getRankForExp(exp);
  const title = getTitleForAccuracy(accuracy);
  const { progress, next } = getExpProgress(exp);

  const allTabs: { value: ProfileTab; label: string; count: number }[] = [
    { value: "activity", label: "활동", count: totalReports },
    { value: "blacklist", label: "블랙리스트", count: 0 },
    { value: "followers", label: "팔로워", count: followerCount },
    { value: "following", label: "팔로잉", count: followingCount },
  ];
  // 비로그인 시 활동만 표시
  const tabs = isLoggedIn ? allTabs : allTabs.filter(t => t.value === "activity");

  // 비공개 프로필
  if (profile.isPrivate) {
    return (
      
        <div className="mx-auto max-w-screen-md px-5 py-8">
          <div className="bg-card rounded-3xl border border-border/40 shadow-toss overflow-hidden">
            <div className="px-6 pt-6 pb-5 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-secondary ring-4 ring-card shadow-toss-md flex items-center justify-center overflow-hidden">
                  {profile.image ? (
                    <img src={profile.image} alt="프로필" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[34px] font-bold text-primary/80">{name.charAt(0)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <h1 className="text-[22px] font-bold tracking-tight text-foreground">{name}</h1>
                {role !== "USER" && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${roleInfo.bg} ${roleInfo.color}`}>{roleInfo.label}</span>
                )}
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-500">
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><rect x="2" y="5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M3 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  비공개
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-card rounded-3xl border border-border/40 shadow-toss p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-toss-gray-50 dark:bg-secondary flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
                <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">비공개 프로필</p>
            <p className="text-[13px] text-toss-gray-500 leading-relaxed">서로 팔로우 상태에서만 활동 정보를 볼 수 있습니다.</p>
          </div>
        </div>
      
    );
  }

  return (
    
    <div className="mx-auto max-w-screen-md px-5 py-8">

      {/* ─── Hero Card ─── */}
      <div className="bg-card rounded-3xl border border-border/40 shadow-toss overflow-hidden">

        {/* Profile Identity */}
        <div className="px-6 pt-6 pb-5 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-secondary ring-4 ring-card shadow-toss-md flex items-center justify-center overflow-hidden">
              {profile.image ? (
                <img src={profile.image} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[34px] font-bold text-primary/80">{name.charAt(0)}</span>
              )}
            </div>
            {hasBarracks && (
              <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-primary ring-[3px] ring-card flex items-center justify-center" title="서든어택 인증됨">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>

          {/* Name row */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <h1 className="text-[22px] font-bold tracking-tight text-foreground">{name}</h1>
            {role !== "USER" && (
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${roleInfo.bg} ${roleInfo.color}`}>{roleInfo.label}</span>
            )}
          </div>

          {/* Rank + Title */}
          <div className="flex items-center gap-1.5 mt-2">
            <RankBadge rank={rank} size="md" />
            <TitleBadge title={title} size="md" />
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-[13px] text-toss-gray-500 mt-3 max-w-xs leading-relaxed">{profile.bio}</p>
          )}

          {/* 서든어택 전적 보기 */}
          {profile.barracksAddress && (
            <Link
              href={`/search/player?nexonSn=${profile.barracksAddress}`}
              className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80 transition-colors mt-3"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v4M4 3l2-2 2 2M1 7.5C1 6.67 1.67 6 2.5 6h7c.83 0 1.5.67 1.5 1.5V10c0 .83-.67 1.5-1.5 1.5h-7C1.67 11.5 1 10.83 1 10V7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              서든어택 전적 보기
            </Link>
          )}

          {/* 팔로우 버튼 */}
          <div className="flex flex-col items-center gap-2 mt-5">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`h-9 px-6 rounded-full text-[12px] font-semibold transition-all active:scale-[0.97] ${
                isFollowing
                  ? "bg-primary/10 text-primary border border-primary/20 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:border-red-500/20"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {isFollowing ? "팔로잉" : "팔로우"}
            </button>
            {isFollowedBy && !isFollowing && (
              <p className="text-[11px] text-primary font-medium">나를 팔로우하고 있습니다</p>
            )}
            {isFollowing && isFollowedBy && (
              <p className="text-[11px] text-primary font-medium">서로 팔로우</p>
            )}
          </div>
        </div>

        {/* ─── Stats Grid ─── */}
        <div className="border-t border-border/30">
          <div className="grid grid-cols-4 divide-x divide-border/30">
            {[
              { value: `${accuracy}%`, label: "명중률", color: getAccuracyColor(accuracy) },
              { value: totalReports, label: "신고", color: "text-foreground" },
              { value: followerCount, label: "팔로워", color: "text-foreground" },
              { value: followingCount, label: "팔로잉", color: "text-foreground" },
            ].map((stat) => (
              <div key={stat.label} className="py-4 text-center">
                <p className={`text-[18px] sm:text-[20px] font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] sm:text-[11px] text-toss-gray-400 mt-0.5 tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Combat Stats (K/D/A + EXP) ─── */}
        <div className="border-t border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[13px]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-toss-red inline-block" />
                <span className="font-semibold text-foreground">{kills}</span>
                <span className="text-toss-gray-400">킬</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-toss-blue inline-block" />
                <span className="font-semibold text-foreground">{deaths}</span>
                <span className="text-toss-gray-400">데스</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-toss-green inline-block" />
                <span className="font-semibold text-foreground">{assists}</span>
                <span className="text-toss-gray-400">어시</span>
              </div>
            </div>
            <span className="text-[12px] text-toss-gray-400 tabular-nums">{exp.toLocaleString()} EXP</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
                style={{ width: `${Math.max(progress * 100, 2)}%` }}
              />
            </div>
            {next && (
              <span className="text-[11px] text-toss-gray-400 shrink-0">{next.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tabs — Apple style underline ─── */}
      <div className="flex mt-6 mb-1 border-b border-border/40">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`relative pb-3 px-1 text-[13px] font-medium transition-colors flex-1 ${
              activeTab === tab.value
                ? "text-foreground"
                : "text-toss-gray-400 hover:text-toss-gray-600"
            }`}
          >
            <span className="relative inline-block">
              {tab.label}
              <span className={`ml-1 text-[11px] tabular-nums ${activeTab === tab.value ? "text-primary" : "text-toss-gray-300"}`}>
                {tab.count}
              </span>
              {activeTab === tab.value && (
                <span className="absolute -bottom-3 left-0 right-0 h-[2px] rounded-full bg-primary" />
              )}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <div className="py-6">
        {activeTab === "activity" && <UserActivityTab userId={userId} />}
        {activeTab === "blacklist" && (
          <EmptyState icon={<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>} title="블랙리스트는 비공개입니다" description="" />
        )}
        {activeTab === "followers" && <UserFollowTab userId={userId} type="followers" />}
        {activeTab === "following" && <UserFollowTab userId={userId} type="following" />}
      </div>
      {showLoginPrompt && <LoginPrompt onClose={() => setShowLoginPrompt(false)} />}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-toss-gray-50 dark:bg-secondary flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-toss-gray-300">
          {icon}
        </svg>
      </div>
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      {description && <p className="text-[13px] text-toss-gray-400 mt-1">{description}</p>}
    </div>
  );
}

// ─── Activity Tab ───

type ActivityItem = {
  id: string;
  nickname: string;
  reportType: "hack" | "manner";
  status?: string;
  evidences?: unknown;
  description?: string | null;
  createdAt: string;
};

function getYtThumb(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

function getThumb(item: ActivityItem): string | null {
  const evs = (item.evidences ?? []) as { type: string; url: string }[];
  for (const e of evs) {
    if (e.type === "screenshot") return e.url;
    if (e.type === "youtube") { const t = getYtThumb(e.url); if (t) return t; }
  }
  return null;
}

const HACK_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  SUSPECT: { label: "의심", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
  PROBABLE: { label: "유력", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20" },
  CONFIRMED: { label: "확정", color: "text-white", bg: "bg-toss-red" },
  DISMISSED: { label: "기각", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
};

function UserActivityTab({ userId }: { userId: string }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/activity?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => setActivities(d.activities ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="aspect-square rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return <EmptyState icon={<path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>} title="아직 신고 활동이 없습니다" description="" />;
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {activities.map((item) => {
        const thumb = getThumb(item);
        const isHack = item.reportType === "hack";
        const href = isHack ? `/reports/${item.id}` : `/manner/${item.id}`;
        const statusInfo = isHack && item.status ? HACK_STATUS_MAP[item.status] : null;
        return (
          <Link key={item.id} href={href} className="group relative aspect-square rounded-2xl overflow-hidden bg-toss-gray-100 dark:bg-toss-gray-800 border border-border/30 hover:shadow-toss-md transition-all hover:-translate-y-0.5">
            {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <div className={`w-full h-full ${isHack ? "bg-gradient-to-br from-toss-red/10 to-toss-red/5" : "bg-gradient-to-br from-toss-orange/10 to-toss-orange/5"}`} />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-2 left-2">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isHack ? "bg-toss-red/90 text-white" : "bg-toss-orange/90 text-white"}`}>{isHack ? "핵" : "비매너"}</span>
            </div>
            {statusInfo && <div className="absolute top-2 right-2"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span></div>}
            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <p className="text-[12px] font-semibold text-white truncate">{item.nickname}</p>
              {item.description && <p className="text-[10px] text-white/70 truncate mt-0.5">{item.description}</p>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Follow Tab ───

type FollowUserItem = {
  id: string;
  nickname: string | null;
  image: string | null;
  barracksVerified: boolean;
  isFollowingBack: boolean;
};

function UserFollowTab({ userId, type }: { userId: string; type: "followers" | "following" }) {
  const [users, setUsers] = useState<FollowUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/follow/list?userId=${userId}&type=${type}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, type]);

  async function handleToggleFollow(targetId: string) {
    setTogglingId(targetId);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetId }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === targetId ? { ...u, isFollowingBack: data.following } : u));
      }
    } catch { /* ignore */ }
    finally { setTogglingId(null); }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-11 h-11 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800" />
            <div className="flex-1 space-y-1.5"><div className="h-4 w-24 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return <EmptyState icon={<><circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 20a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>} title={type === "followers" ? "팔로워가 없습니다" : "팔로잉이 없습니다"} description="" />;
  }

  return (
    <div className="space-y-1">
      {users.map((user) => {
        const displayName = user.nickname ?? "유저";
        return (
          <div key={user.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/50 transition-colors">
            <Link href={`/profile/${user.id}`} className="shrink-0">
              <div className="w-11 h-11 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center overflow-hidden">
                {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : <span className="text-[15px] font-bold text-toss-gray-500">{displayName.charAt(0)}</span>}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link href={`/profile/${user.id}`} className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors truncate">{displayName}</Link>
                {user.barracksVerified && (
                  <span className="w-[16px] h-[16px] rounded-full bg-primary flex items-center justify-center shrink-0">
                    <svg width="9" height="9" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleToggleFollow(user.id)}
              disabled={togglingId === user.id}
              className={`shrink-0 h-8 px-4 rounded-full text-[12px] font-semibold transition-all active:scale-[0.97] ${
                user.isFollowingBack
                  ? "bg-primary/10 text-primary border border-primary/20 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:border-red-500/20"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {user.isFollowingBack ? "팔로잉" : "팔로우"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
