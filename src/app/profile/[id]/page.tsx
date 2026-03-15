"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { TitleBadge, RankBadge } from "@/components/common/title-badge";
import { AuthGuard } from "@/components/common/auth-guard";
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
  const { user: authUser } = useAuth();
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

  async function handleFollow() {
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
      <AuthGuard>
        <div className="mx-auto max-w-screen-md px-5 py-8">
          <div className="bg-card rounded-3xl border border-border/40 shadow-toss overflow-hidden">
            <div className="px-6 pt-6 pb-5 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse mb-4" />
              <div className="h-6 w-32 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse mb-2" />
              <div className="h-4 w-24 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (notFound || !profile) {
    return (
      <AuthGuard>
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
      </AuthGuard>
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

  const tabs: { value: ProfileTab; label: string; count: number }[] = [
    { value: "activity", label: "활동", count: totalReports },
    { value: "blacklist", label: "블랙리스트", count: 0 },
    { value: "followers", label: "팔로워", count: followerCount },
    { value: "following", label: "팔로잉", count: followingCount },
  ];

  // 비공개 프로필
  if (profile.isPrivate) {
    return (
      <AuthGuard>
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
            <p className="text-[13px] text-toss-gray-500 leading-relaxed">이 유저의 활동 정보는 비공개입니다.</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
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

          {/* 병영수첩 바로가기 */}
          {barracksUrl && (
            <a
              href={barracksUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80 transition-colors mt-3"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 1H2.5C1.67 1 1 1.67 1 2.5V9.5C1 10.33 1.67 11 2.5 11H9.5C10.33 11 11 10.33 11 9.5V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M7 1H11V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 1L5.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              병영수첩 바로가기
            </a>
          )}

          {/* 팔로우 버튼 */}
          <div className="flex flex-col items-center gap-2 mt-5">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`h-9 px-6 rounded-full text-[12px] font-semibold transition-all active:scale-[0.97] ${
                isFollowing
                  ? "bg-secondary text-foreground border border-border/60 hover:bg-secondary/80"
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

      {/* ─── Tabs ─── */}
      <div className="flex mt-6 mb-1 border-b border-border/40">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 pb-3 text-[13px] font-medium transition-colors relative ${
              activeTab === tab.value
                ? "text-foreground"
                : "text-toss-gray-400 hover:text-toss-gray-600"
            }`}
          >
            {tab.label}
            <span className={`ml-1 text-[11px] tabular-nums ${activeTab === tab.value ? "text-primary" : "text-toss-gray-300"}`}>
              {tab.count}
            </span>
            {activeTab === tab.value && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <div className="py-12">
        <EmptyState
          icon={<path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
          title={
            activeTab === "activity" ? "아직 신고 활동이 없습니다" :
            activeTab === "blacklist" ? "블랙리스트가 비어있습니다" :
            activeTab === "followers" ? "팔로워가 없습니다" :
            "팔로잉이 없습니다"
          }
          description=""
        />
      </div>
    </div>
    </AuthGuard>
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
