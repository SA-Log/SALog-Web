"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { TitleBadge, RankBadge, AccuracyBadge } from "@/components/common/title-badge";
import { AuthGuard } from "@/components/common/auth-guard";
import {
  mockMyProfile,
  mockActivities,
  mockBlacklist,
  mockFollowing,
  mockFollowers,
  getExpProgress,
  getAccuracyColor,
  formatRelativeTime,
  HACK_STATUS_MAP,
  ROLE_MAP,
  type Activity,
  type BlacklistEntry,
  type FollowUser,
} from "@/lib/mock-data";

type ProfileTab = "activity" | "blacklist" | "following" | "followers";

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("서든어택 핵 유저 감시자. 클린 게임 문화를 만들어갑니다.");
  const [editNickname, setEditNickname] = useState(mockMyProfile.name);
  const [bio, setBio] = useState("서든어택 핵 유저 감시자. 클린 게임 문화를 만들어갑니다.");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const [isProfilePublic, setIsProfilePublic] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("salog_profile_public") !== "false";
  });
  const [editIsPublic, setEditIsPublic] = useState(isProfilePublic);

  const [editBroadcastUrl, setEditBroadcastUrl] = useState(mockMyProfile.broadcastUrl ?? "");
  const [editYoutubeUrl, setEditYoutubeUrl] = useState(mockMyProfile.youtubeUrl ?? "");
  const [editOtherLinks, setEditOtherLinks] = useState<{ label: string; url: string }[]>(mockMyProfile.otherLinks ?? []);
  const [broadcastUrl, setBroadcastUrl] = useState(mockMyProfile.broadcastUrl ?? "");
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState(mockMyProfile.youtubeUrl ?? "");
  const [otherLinks, setOtherLinks] = useState<{ label: string; url: string }[]>(mockMyProfile.otherLinks ?? []);

  // 프로필 페이지는 아직 mock 데이터 사용 — 향후 DB 연동 시 교체
  const user = mockMyProfile;
  const { progress, next } = getExpProgress(user.exp);
  const hasBarracks = !!user.barracksAddress;
  const isCreator = user.role === "VERIFIED_CREATOR";
  const isStaff = user.role === "MASTER" || user.role === "VICE_MASTER" || user.role === "OPERATOR";
  const isSpecialRole = isCreator || isStaff;
  const roleInfo = ROLE_MAP[user.role];

  const tabs: { value: ProfileTab; label: string; count: number }[] = [
    { value: "activity", label: "활동", count: mockActivities.length },
    { value: "blacklist", label: "블랙리스트", count: mockBlacklist.length },
    { value: "following", label: "팔로잉", count: mockFollowing.length },
    { value: "followers", label: "팔로워", count: mockFollowers.length },
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 크리에이터는 무조건 공개
  const effectiveIsPublic = isCreator ? true : isProfilePublic;

  const handleSave = () => {
    setBio(editBio);
    if (!isCreator) {
      setIsProfilePublic(editIsPublic);
      localStorage.setItem("salog_profile_public", String(editIsPublic));
    }
    if (isCreator) {
      setBroadcastUrl(editBroadcastUrl);
      setYoutubeChannelUrl(editYoutubeUrl);
      setOtherLinks(editOtherLinks.filter((l) => l.url.trim()));
    }
    setIsEditing(false);
  };

  return (
    <AuthGuard>
    <div className="mx-auto max-w-screen-lg px-5 py-6">
      {/* Profile Header */}
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
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-card border-4 border-card shadow-toss-md flex items-center justify-center shrink-0 overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[28px] sm:text-[32px] font-bold text-primary">{user.name.charAt(0)}</span>
              )}
            </div>

            {/* Name + Badges */}
            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[20px] sm:text-[22px] font-bold text-foreground truncate">{user.name}</h1>
                {/* 병영수첩 연동 체크마크 */}
                {hasBarracks && (
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
                {!effectiveIsPublic && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-500">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="2" y="5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1"/><path d="M3 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                    비공개
                  </span>
                )}
              </div>
              <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mt-1">{bio}</p>
              {hasBarracks && (
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
              {!hasBarracks && (
                <p className="text-[11px] text-toss-gray-400 mt-1 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1"/><path d="M5 3v2.5M5 7h.005" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                  병영수첩 미연동
                </p>
              )}
              {/* 크리에이터 링크 */}
              {isCreator && (broadcastUrl || youtubeChannelUrl || otherLinks.length > 0) && (
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {youtubeChannelUrl && (
                    <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-toss-red hover:underline">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1"/><path d="M5 5v2.5l2.5-1.25L5 5z" fill="currentColor"/></svg>
                      유튜브
                    </a>
                  )}
                  {broadcastUrl && (
                    <a href={broadcastUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-toss-green hover:underline">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1"/><path d="M4 6l1.5 1.5L8 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      방송국
                    </a>
                  )}
                  {otherLinks.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1H2.5C1.67 1 1 1.67 1 2.5v5C1 8.33 1.67 9 2.5 9h5C8.33 9 9 8.33 9 7.5V5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><path d="M6 1h3v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 1L5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 shrink-0 self-start sm:self-auto">
              {/* 인증 크리에이터 신청 버튼 */}
              {!isCreator && (
                <Link href="/creator/apply"
                  className="h-9 px-4 rounded-xl bg-toss-green/10 text-toss-green text-[13px] font-medium border border-toss-green/20 flex items-center gap-1.5 btn-chip">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  크리에이터 신청
                </Link>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="h-9 px-4 rounded-xl bg-secondary text-[13px] font-medium text-foreground border border-border btn-secondary"
              >
                프로필 수정
              </button>
            </div>
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
              <p className="text-[20px] font-bold text-foreground">{mockFollowers.length}</p>
              <p className="text-[11px] text-toss-gray-500 mt-0.5">팔로워</p>
            </div>
            <div className="text-center">
              <p className="text-[20px] font-bold text-foreground">{mockFollowing.length}</p>
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

      {/* Tabs */}
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
      {activeTab === "activity" && <ActivityFeed activities={mockActivities} />}
      {activeTab === "blacklist" && <BlacklistSection entries={mockBlacklist} />}
      {activeTab === "following" && <FollowSection users={mockFollowing} type="following" />}
      {activeTab === "followers" && <FollowSection users={mockFollowers} type="followers" />}

      {/* 로그아웃 */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="h-9 px-4 rounded-xl bg-secondary text-[13px] font-medium text-toss-gray-600 dark:text-toss-gray-400 border border-border btn-secondary">
          로그아웃
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-toss-lg p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-[18px] font-bold text-foreground mb-5">프로필 수정</h2>

            {/* Avatar edit */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[22px] font-bold text-primary">{user.name.charAt(0)}</span>
                )}
              </div>
              <div className="space-y-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-3 rounded-lg bg-primary/10 text-[12px] font-medium text-primary btn-chip">
                  사진 변경
                </button>
                {avatarPreview && (
                  <button
                    onClick={() => { setAvatarPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="h-8 px-3 rounded-lg text-[12px] font-medium text-toss-gray-500 hover:text-toss-red transition-toss ml-1">
                    제거
                  </button>
                )}
              </div>
            </div>

            {/* Nickname — 수정 불가 */}
            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-foreground mb-1.5">닉네임</label>
              <div className="w-full h-10 px-3 rounded-xl bg-toss-gray-50 dark:bg-secondary border border-border text-[14px] flex items-center text-toss-gray-500">
                {user.name}
                {hasBarracks && (
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-toss-green">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l1.5 1.5 3.5-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    연동됨
                  </span>
                )}
                {!hasBarracks && (
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-toss-gray-400">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7.5 1.25L2.5 8.75M3.75 2.5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zM6.25 5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/></svg>
                    수정 불가
                  </span>
                )}
              </div>
              <p className="text-[11px] text-toss-gray-400 mt-1">
                {hasBarracks
                  ? "병영수첩 연동 시 닉네임은 자동 설정됩니다"
                  : "닉네임은 변경할 수 없습니다. 병영수첩을 연동하면 닉네임이 자동으로 설정됩니다."}
              </p>
            </div>

            {/* Bio */}
            <div className="mb-5">
              <label className="block text-[13px] font-semibold text-foreground mb-1.5">소개</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value.slice(0, 100))}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-toss-gray-50 dark:bg-secondary border border-border text-[13px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none leading-relaxed"
                maxLength={100}
              />
              <p className="text-[11px] text-toss-gray-400 mt-1">{editBio.length}/100</p>
            </div>

            {/* Profile Privacy */}
            <div className="mb-5">
              <p className="text-[13px] font-semibold text-foreground mb-2">프로필 공개 설정</p>
              {isCreator ? (
                <div className="p-3 rounded-xl bg-toss-green/5 border border-toss-green/20">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#22c55e" strokeWidth="1.2"/><path d="M4.5 7l2 2 3.5-3.5" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <p className="text-[13px] font-medium text-toss-green">항상 공개</p>
                  </div>
                  <p className="text-[11px] text-toss-gray-500 mt-1">
                    인증 크리에이터는 활동, 블랙리스트, 팔로잉/팔로워가 모든 유저에게 공개됩니다
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-toss-gray-50 dark:bg-secondary border border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">프로필 공개</p>
                      <p className="text-[11px] text-toss-gray-500 mt-0.5">
                        {editIsPublic
                          ? "모든 유저가 내 활동, 블랙리스트, 팔로잉/팔로워를 볼 수 있습니다"
                          : "팔로우한 유저만 내 활동, 블랙리스트, 팔로잉/팔로워를 볼 수 있습니다"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditIsPublic(!editIsPublic)}
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors ${editIsPublic ? "bg-primary" : "bg-toss-gray-300 dark:bg-toss-gray-600"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${editIsPublic ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Creator Links (VERIFIED_CREATOR only) */}
            {isCreator && (
              <div className="mb-5 space-y-3">
                <p className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                  크리에이터 링크
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-toss-green/10 text-toss-green">인증</span>
                </p>

                <div>
                  <label className="block text-[12px] text-toss-gray-500 mb-1">유튜브 채널</label>
                  <input
                    type="url"
                    value={editYoutubeUrl}
                    onChange={(e) => setEditYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/@..."
                    className="w-full h-10 px-3 rounded-xl bg-toss-gray-50 dark:bg-secondary border border-border text-[13px] outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-toss-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-[12px] text-toss-gray-500 mb-1">방송국 주소</label>
                  <input
                    type="url"
                    value={editBroadcastUrl}
                    onChange={(e) => setEditBroadcastUrl(e.target.value)}
                    placeholder="https://chzzk.naver.com/... 또는 https://www.sooplive.co.kr/..."
                    className="w-full h-10 px-3 rounded-xl bg-toss-gray-50 dark:bg-secondary border border-border text-[13px] outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-toss-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-[12px] text-toss-gray-500 mb-1">기타 링크</label>
                  {editOtherLinks.map((link, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => {
                          const next = [...editOtherLinks];
                          next[i] = { ...next[i], label: e.target.value };
                          setEditOtherLinks(next);
                        }}
                        placeholder="라벨 (예: 디스코드)"
                        className="w-24 h-9 px-2 rounded-lg bg-toss-gray-50 dark:bg-secondary border border-border text-[12px] outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-toss-gray-400"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => {
                          const next = [...editOtherLinks];
                          next[i] = { ...next[i], url: e.target.value };
                          setEditOtherLinks(next);
                        }}
                        placeholder="URL"
                        className="flex-1 h-9 px-2 rounded-lg bg-toss-gray-50 dark:bg-secondary border border-border text-[12px] outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-toss-gray-400"
                      />
                      <button
                        onClick={() => setEditOtherLinks(editOtherLinks.filter((_, j) => j !== i))}
                        className="w-9 h-9 rounded-lg bg-toss-red/10 flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="#f04452" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  ))}
                  {editOtherLinks.length < 5 && (
                    <button
                      onClick={() => setEditOtherLinks([...editOtherLinks, { label: "", url: "" }])}
                      className="text-[12px] text-primary font-medium hover:underline">
                      + 링크 추가
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Email notifications */}
            <div className="mb-6 space-y-2">
              <p className="text-[13px] font-semibold text-foreground mb-2">이메일 알림</p>
              <div className="p-3 rounded-xl bg-toss-gray-50 dark:bg-secondary border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">블랙리스트 닉변 알림</p>
                    <p className="text-[11px] text-toss-gray-500 mt-0.5">블랙리스트 유저가 닉네임을 변경하면 알림</p>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-primary p-0.5 cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm translate-x-4 transition-transform" />
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-toss-gray-50 dark:bg-secondary border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">팔로잉 블랙리스트 알림</p>
                    <p className="text-[11px] text-toss-gray-500 mt-0.5">팔로잉한 유저가 블랙리스트를 추가하면 알림</p>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-primary p-0.5 cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm translate-x-4 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 h-11 rounded-xl bg-secondary text-[14px] font-semibold text-toss-gray-600 btn-secondary"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="flex-1 h-11 rounded-xl bg-primary text-white text-[14px] font-semibold btn-primary"
              >
                저장
              </button>
            </div>

            {/* 회원탈퇴 */}
            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsEditing(false); setShowDeleteConfirm(true); }}
                className="text-[11px] text-toss-gray-400 underline hover:text-toss-gray-600 transition-colors"
              >
                회원탈퇴
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-toss-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-[18px] font-bold text-foreground mb-2">로그아웃</h2>
            <p className="text-[14px] text-toss-gray-500 mb-6">정말 로그아웃 하시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-11 rounded-xl bg-secondary text-[14px] font-semibold text-toss-gray-600 btn-secondary">
                취소
              </button>
              <button
                onClick={() => { logout(); router.push("/login"); }}
                className="flex-1 h-11 rounded-xl bg-toss-gray-800 dark:bg-toss-gray-200 text-white dark:text-toss-gray-800 text-[14px] font-semibold btn-primary">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-2xl border border-border shadow-toss-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-[18px] font-bold text-toss-red mb-2">회원탈퇴</h2>
            <div className="space-y-2 mb-5">
              <p className="text-[14px] text-toss-gray-600 dark:text-toss-gray-400">탈퇴 시 아래 데이터가 모두 삭제됩니다.</p>
              <ul className="text-[12px] text-toss-gray-500 space-y-1">
                <li>• 프로필, 신고 기록, 투표 기록</li>
                <li>• 블랙리스트, 팔로우/팔로워</li>
                <li>• 경험치, 계급, 칭호</li>
              </ul>
              <p className="text-[13px] text-toss-red font-semibold mt-3">이 작업은 되돌릴 수 없습니다.</p>
            </div>

            <div className="mb-4">
              <label className="block text-[12px] font-semibold text-toss-gray-500 mb-1.5">
                확인을 위해 &quot;탈퇴합니다&quot;를 입력하세요
              </label>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="탈퇴합니다"
                className="w-full h-10 px-3 rounded-xl bg-toss-gray-50 dark:bg-secondary border border-border text-[14px] outline-none focus:ring-2 focus:ring-toss-red/20 placeholder:text-toss-gray-400" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                className="flex-1 h-11 rounded-xl bg-secondary text-[14px] font-semibold text-toss-gray-600 btn-secondary">
                취소
              </button>
              <button
                disabled={deleteInput !== "탈퇴합니다"}
                onClick={() => { logout(); router.push("/login"); }}
                className={`flex-1 h-11 rounded-xl text-[14px] font-semibold transition-toss ${
                  deleteInput === "탈퇴합니다"
                    ? "bg-toss-red text-white btn-primary"
                    : "bg-toss-gray-200 dark:bg-toss-gray-700 text-toss-gray-400 cursor-not-allowed"
                }`}>
                회원탈퇴
              </button>
            </div>
          </div>
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
          <p className="text-[13px] text-toss-gray-500 mt-1">핵 유저를 발견하면 신고해주세요</p>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const hasMedia = !!activity.mediaUrl;

  return (
    <Link
      href={`/reports/${activity.targetId}`}
      className="group relative aspect-square bg-card rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden shadow-toss hover:shadow-toss-md transition-all duration-200 hover:-translate-y-0.5"
    >
      {hasMedia ? (
        <>
          {/* Media thumbnail */}
          <img src={activity.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

          {/* Video play icon */}
          {activity.mediaType === "video" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5.5 3L12.5 8L5.5 13V3Z" fill="white"/></svg>
              </div>
            </div>
          )}

          {/* Info overlay */}
          <div className="relative h-full flex flex-col justify-between p-2.5 sm:p-3.5">
            <div className="flex justify-end">
              <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${HACK_STATUS_MAP[activity.hackStatus].bg} ${HACK_STATUS_MAP[activity.hackStatus].color}`}>
                {HACK_STATUS_MAP[activity.hackStatus].label}
              </span>
            </div>
            <div>
              <p className="text-[12px] sm:text-[13px] font-semibold text-white truncate">{activity.targetNickname}</p>
              <p className="text-[9px] sm:text-[10px] text-white/70 mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Text thumbnail - description fills the card */}
          <div className={`absolute inset-0 ${activity.thumbnailColor}`} />
          <div className="relative h-full flex flex-col p-2.5 sm:p-3.5 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <p className="text-[12px] sm:text-[14px] font-medium text-foreground leading-relaxed" style={{ display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{activity.description.replace(/https?:\/\/\S+/g, "").trim()}</p>
            </div>
            <div className="mt-auto pt-1.5 flex items-center justify-between">
              <p className="text-[10px] sm:text-[11px] font-semibold text-toss-gray-600 dark:text-toss-gray-400 truncate">{activity.targetNickname}</p>
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${HACK_STATUS_MAP[activity.hackStatus].bg} ${HACK_STATUS_MAP[activity.hackStatus].color}`}>
                {HACK_STATUS_MAP[activity.hackStatus].label}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors duration-200 rounded-xl sm:rounded-2xl" />
    </Link>
  );
}

// ==================== Blacklist Section ====================

function BlacklistSection({ entries }: { entries: BlacklistEntry[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500">
          닉네임 변경 시 이메일로 알려드립니다
        </p>
        <span className="text-[12px] text-toss-gray-400">{entries.length}명</span>
      </div>

      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-card rounded-2xl border border-border/50 shadow-toss p-4 hover:shadow-toss-md transition-toss">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-xl bg-toss-red/10 flex items-center justify-center shrink-0">
                <span className="text-[14px] font-bold text-toss-red">{entry.currentNickname.charAt(0)}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-foreground truncate">{entry.currentNickname}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${HACK_STATUS_MAP[entry.status].bg} ${HACK_STATUS_MAP[entry.status].color}`}>
                    {HACK_STATUS_MAP[entry.status].label}
                  </span>
                </div>
                <a href={entry.barracksAddress} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-primary font-medium hover:underline">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 1H2.5C1.67 1 1 1.67 1 2.5V9.5C1 10.33 1.67 11 2.5 11H9.5C10.33 11 11 10.33 11 9.5V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M7 1H11V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 1L5.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    병영주소 바로가기
                  </a>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-toss-gray-500">
                  {entry.nicknameChanges > 0 && (
                    <span className="text-toss-orange font-medium">닉변 {entry.nicknameChanges}회</span>
                  )}
                  <span>마지막 확인: {formatRelativeTime(entry.lastCheckedAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/reports/${entry.id.replace("bl", "")}`}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center btn-ghost"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-toss-gray-500"/>
                  </svg>
                </Link>
                <button className="w-8 h-8 rounded-lg bg-toss-red/10 flex items-center justify-center btn-ghost">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2L10 10M2 10L10 2" stroke="#f04452" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
              <path d="M13 7L7 13M7 7L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
            </svg>
          </div>
          <p className="text-[15px] text-foreground font-semibold">블랙리스트가 비어있습니다</p>
          <p className="text-[13px] text-toss-gray-500 mt-1">핵 유저 상세 페이지에서 추가할 수 있습니다</p>
        </div>
      )}
    </div>
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
          {type === "following" ? "내가 팔로우하는 유저" : "나를 팔로우하는 유저"}
        </p>
        <span className="text-[12px] text-toss-gray-400">{users.length}명</span>
      </div>

      <div className="flex flex-col gap-2">
        {users.map((user) => {
          const isFollowing = followState[user.id] ?? false;
          return (
            <Link key={user.id} href={`/profile/${user.id}`} className="bg-card rounded-2xl border border-border/50 shadow-toss p-4 hover:shadow-toss-md transition-toss block">
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
            {type === "following" ? "아직 팔로우하는 유저가 없습니다" : "아직 팔로워가 없습니다"}
          </p>
          <p className="text-[13px] text-toss-gray-500 mt-1">
            {type === "following" ? "랭킹에서 활발한 유저를 팔로우해보세요" : "활발한 활동으로 팔로워를 늘려보세요"}
          </p>
        </div>
      )}
    </div>
  );
}
