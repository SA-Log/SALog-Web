"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [bio, setBio] = useState("");
  const [savedImage, setSavedImage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [notifyBlacklist, setNotifyBlacklist] = useState(true);
  const [notifyFollow, setNotifyFollow] = useState(true);
  const [editNotifyBlacklist, setEditNotifyBlacklist] = useState(true);
  const [editNotifyFollow, setEditNotifyFollow] = useState(true);

  // DB에서 프로필 정보 로드
  useEffect(() => {
    fetch("/api/profile/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setBio(data.bio ?? "");
          setIsProfilePublic(data.isProfilePublic ?? true);
          setEditIsPublic(data.isProfilePublic ?? true);
          setNotifyBlacklist(data.notifyBlacklistNickchange ?? true);
          setNotifyFollow(data.notifyFollowBlacklist ?? true);
          setEditNotifyBlacklist(data.notifyBlacklistNickchange ?? true);
          setEditNotifyFollow(data.notifyFollowBlacklist ?? true);
          if (data.image) setSavedImage(data.image);
          setFollowerCount(data.followerCount ?? 0);
          setFollowingCount(data.followingCount ?? 0);
          setTotalReports(data.reportCount ?? 0);
          setBlacklistCount(data.blacklistCount ?? 0);
        }
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  }, []);

  const name = authUser?.nickname ?? authUser?.name ?? "유저";
  const role = (authUser?.role ?? "USER") as UserRole;
  const hasBarracks = authUser?.barracksVerified ?? false;
  const isCreator = role === "VERIFIED_CREATOR";
  const isStaff = role === "MASTER" || role === "VICE_MASTER" || role === "OPERATOR";
  const isSpecialRole = isCreator || isStaff;
  const roleInfo = ROLE_MAP[role];
  const effectiveIsPublic = isCreator ? true : isProfilePublic;

  const kills = 0;
  const deaths = 0;
  const assists = 0;
  const exp = 0;
  const accuracy = 0;
  const [totalReports, setTotalReports] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [blacklistCount, setBlacklistCount] = useState(0);

  const rank = getRankForExp(exp);
  const title = getTitleForAccuracy(accuracy);
  const { progress, next } = getExpProgress(exp);


  const tabs: { value: ProfileTab; label: string; count: number }[] = [
    { value: "activity", label: "활동", count: totalReports },
    { value: "blacklist", label: "블랙리스트", count: blacklistCount },
    { value: "followers", label: "팔로워", count: followerCount },
    { value: "following", label: "팔로잉", count: followingCount },
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setRemoveAvatar(false);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 변경사항 감지
  const hasChanges = (() => {
    if (editBio !== bio) return true;
    if (!isCreator && editIsPublic !== isProfilePublic) return true;
    if (editNotifyBlacklist !== notifyBlacklist) return true;
    if (editNotifyFollow !== notifyFollow) return true;
    if (avatarFile) return true;
    if (removeAvatar) return true;
    return false;
  })();

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const fd = new FormData();
      fd.append("bio", editBio);
      if (!isCreator) {
        fd.append("isProfilePublic", String(editIsPublic));
      }
      fd.append("notifyBlacklistNickchange", String(editNotifyBlacklist));
      fd.append("notifyFollowBlacklist", String(editNotifyFollow));
      if (avatarFile) {
        fd.append("avatar", avatarFile);
      }
      if (removeAvatar) {
        fd.append("removeAvatar", "true");
      }

      const res = await fetch("/api/profile/me", { method: "PATCH", body: fd });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        setSaveError(data?.error ?? "저장에 실패했습니다");
        return;
      }

      setBio(data.bio ?? "");
      if (!isCreator) setIsProfilePublic(data.isProfilePublic ?? true);
      setNotifyBlacklist(data.notifyBlacklistNickchange ?? true);
      setNotifyFollow(data.notifyFollowBlacklist ?? true);
      setSavedImage(data.image ?? null);
      setAvatarPreview(null);
      setAvatarFile(null);
      setRemoveAvatar(false);
      setSaveError(null);
      setIsEditing(false);
    } catch {
      setSaveError("네트워크 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const avatarSrc = avatarPreview ?? savedImage ?? authUser?.image ?? null;

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
              {avatarSrc ? (
                <img src={avatarSrc} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[34px] font-bold text-primary/80">{name.charAt(0)}</span>
              )}
            </div>
            {/* 인증 마크 — avatar 우하단 */}
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
            {!effectiveIsPublic && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-500">
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><rect x="2" y="5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M3 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                비공개
              </span>
            )}
          </div>

          {/* Rank + Title */}
          <div className="flex items-center gap-1.5 mt-2">
            <RankBadge rank={rank} size="md" />
            <TitleBadge title={title} size="md" />
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-[13px] text-toss-gray-500 mt-3 max-w-xs leading-relaxed">{bio}</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2.5 mt-5">
            {!hasBarracks && (
              <Link
                href="/verify"
                className="h-9 px-5 rounded-full bg-primary text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all hover:bg-primary/90 active:scale-[0.97]"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M4.5 7.5l2 2 4-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                병영수첩 인증
              </Link>
            )}
            <button
              onClick={() => { setEditBio(bio); setEditIsPublic(isProfilePublic); setIsEditing(true); }}
              className="h-9 px-5 rounded-full bg-secondary text-[12px] font-semibold text-foreground border border-border/60 transition-all hover:bg-secondary/80 active:scale-[0.97]"
            >
              프로필 수정
            </button>
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
          {/* EXP progress bar */}
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
        {activeTab === "activity" && <ProfileActivityTab />}
        {activeTab === "blacklist" && <ProfileBlacklistTab onCountChange={(d) => setBlacklistCount((c) => c + d)} />}
        {activeTab === "followers" && <ProfileFollowTab type="followers" onCountChange={(d) => setFollowerCount((c) => c + d)} />}
        {activeTab === "following" && <ProfileFollowTab type="following" onCountChange={(d) => setFollowingCount((c) => c + d)} />}
      </div>

      {/* ─── Edit Profile Modal ─── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <div className="relative w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border/40 shadow-toss-lg animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto">
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-toss-gray-200 dark:bg-toss-gray-700" />
            </div>

            <div className="px-6 pt-4 sm:pt-6 pb-6">
              <h2 className="text-[20px] font-bold text-foreground mb-6">프로필 수정</h2>

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 mb-6">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-4 ring-border/20">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="프로필" className="w-full h-full object-cover" />
                  ) : !removeAvatar && (savedImage || authUser?.image) ? (
                    <img src={(savedImage || authUser?.image)!} alt="프로필" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[26px] font-bold text-primary/80">{name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors">
                    사진 변경
                  </button>
                  {(avatarPreview || savedImage || authUser?.image) && (
                    <>
                      <span className="text-toss-gray-300">|</span>
                      <button
                        onClick={() => { setAvatarPreview(null); setAvatarFile(null); setRemoveAvatar(true); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="text-[13px] font-medium text-toss-gray-400 hover:text-toss-red transition-colors">
                        제거
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="block text-[12px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-2">소개</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 100))}
                  rows={3}
                  placeholder="자기소개를 입력해주세요"
                  className="w-full px-4 py-3 rounded-2xl bg-toss-gray-50 dark:bg-secondary border border-border/50 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none leading-relaxed placeholder:text-toss-gray-400"
                  maxLength={100}
                />
                <p className="text-[11px] text-toss-gray-400 mt-1.5 text-right tabular-nums">{editBio.length}/100</p>
              </div>

              {/* Privacy */}
              <div className="mb-6">
                <label className="block text-[12px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-3">공개 설정</label>
                {isCreator ? (
                  <div className="p-4 rounded-2xl bg-toss-green/5 border border-toss-green/15">
                    <p className="text-[13px] font-semibold text-toss-green">항상 공개</p>
                    <p className="text-[11px] text-toss-gray-500 mt-1">인증 크리에이터는 프로필이 모든 유저에게 공개됩니다</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-toss-gray-50 dark:bg-secondary border border-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">프로필 공개</p>
                        <p className="text-[12px] text-toss-gray-400 mt-0.5">
                          {editIsPublic ? "모든 유저가 내 활동을 볼 수 있습니다" : "나만 내 활동을 볼 수 있습니다"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditIsPublic(!editIsPublic)}
                        className={`w-[50px] h-[30px] rounded-full p-[3px] transition-colors duration-200 ${editIsPublic ? "bg-primary" : "bg-toss-gray-300 dark:bg-toss-gray-600"}`}
                      >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${editIsPublic ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="mb-8">
                <label className="block text-[12px] font-semibold text-toss-gray-500 uppercase tracking-wider mb-3">이메일 알림</label>
                <div className="space-y-2">
                  <div className="p-4 rounded-2xl bg-toss-gray-50 dark:bg-secondary border border-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">블랙리스트 닉변 알림</p>
                        <p className="text-[12px] text-toss-gray-400 mt-0.5">등록한 유저가 닉네임을 변경하면 알림</p>
                      </div>
                      <button onClick={() => setEditNotifyBlacklist(!editNotifyBlacklist)}
                        className={`w-[50px] h-[30px] rounded-full p-[3px] transition-colors duration-200 ${editNotifyBlacklist ? "bg-primary" : "bg-toss-gray-200 dark:bg-toss-gray-700"}`}>
                        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${editNotifyBlacklist ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-toss-gray-50 dark:bg-secondary border border-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">팔로잉 블랙리스트 알림</p>
                        <p className="text-[12px] text-toss-gray-400 mt-0.5">팔로잉한 유저가 블랙리스트를 추가하면 알림</p>
                      </div>
                      <button onClick={() => setEditNotifyFollow(!editNotifyFollow)}
                        className={`w-[50px] h-[30px] rounded-full p-[3px] transition-colors duration-200 ${editNotifyFollow ? "bg-primary" : "bg-toss-gray-200 dark:bg-toss-gray-700"}`}>
                        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${editNotifyFollow ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save / Cancel */}
              {saveError && (
                <div className="mb-4 p-3 rounded-2xl bg-toss-red/10 border border-toss-red/20">
                  <p className="text-[13px] text-toss-red font-medium">{saveError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setIsEditing(false); setSaveError(null); }}
                  className="flex-1 h-12 rounded-2xl bg-secondary text-[15px] font-semibold text-toss-gray-600 transition-all hover:bg-secondary/80 active:scale-[0.98]"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className={`flex-1 h-12 rounded-2xl text-[15px] font-semibold transition-all ${
                    !hasChanges
                      ? "bg-primary/30 text-white/50 cursor-not-allowed"
                      : isSaving
                        ? "bg-primary/60 text-white cursor-not-allowed"
                        : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
                  }`}
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
              </div>

              {/* 계정 관리 */}
              <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-between">
                <button
                  onClick={() => { setIsEditing(false); setShowDeleteConfirm(true); }}
                  className="text-[12px] text-toss-gray-400 hover:text-toss-red transition-colors"
                >
                  회원탈퇴
                </button>
                <button
                  onClick={() => { setIsEditing(false); setShowLogoutConfirm(true); }}
                  className="text-[12px] text-toss-gray-500 hover:text-toss-gray-700 dark:hover:text-toss-gray-300 transition-colors font-medium"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Logout Confirm ─── */}
      {showLogoutConfirm && (
        <ConfirmModal
          title="로그아웃"
          description="정말 로그아웃 하시겠습니까?"
          cancelText="취소"
          confirmText="로그아웃"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={() => logout()}
        />
      )}

      {/* ─── Delete Account ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-card rounded-3xl border border-border/40 shadow-toss-lg p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-[20px] font-bold text-toss-red mb-3">회원탈퇴</h2>
            <div className="space-y-2 mb-5">
              <p className="text-[14px] text-toss-gray-500 leading-relaxed">탈퇴 시 모든 데이터가 영구 삭제됩니다.</p>
              <ul className="text-[13px] text-toss-gray-400 space-y-1.5 pl-1">
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-toss-gray-300 inline-block" />프로필, 신고 기록, 투표 기록</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-toss-gray-300 inline-block" />블랙리스트, 팔로우/팔로워</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-toss-gray-300 inline-block" />경험치, 계급, 칭호</li>
              </ul>
            </div>

            <div className="mb-5">
              <label className="block text-[12px] font-semibold text-toss-gray-400 mb-2">
                확인을 위해 &quot;탈퇴합니다&quot;를 입력하세요
              </label>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="탈퇴합니다"
                className="w-full h-11 px-4 rounded-2xl bg-toss-gray-50 dark:bg-secondary border border-border/50 text-[14px] outline-none focus:ring-2 focus:ring-toss-red/20 placeholder:text-toss-gray-400" />
            </div>

            {deleteError && (
              <p className="text-[12px] text-toss-red mb-3">{deleteError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); setDeleteError(""); }}
                className="flex-1 h-12 rounded-2xl bg-secondary text-[15px] font-semibold text-toss-gray-600 transition-all active:scale-[0.98]">
                취소
              </button>
              <button
                disabled={deleteInput !== "탈퇴합니다" || isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  setDeleteError("");
                  try {
                    const res = await fetch("/api/auth/delete-account", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ confirm: deleteInput }),
                    });
                    const data = await res.json().catch(() => null);
                    if (!res.ok || !data?.success) {
                      setDeleteError(data?.error || "탈퇴에 실패했습니다");
                      return;
                    }
                    logout();
                  } catch {
                    setDeleteError("서버 연결에 실패했습니다");
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className={`flex-1 h-12 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98] ${
                  deleteInput === "탈퇴합니다" && !isDeleting
                    ? "bg-toss-red text-white"
                    : "bg-toss-gray-200 dark:bg-toss-gray-700 text-toss-gray-400 cursor-not-allowed"
                }`}>
                {isDeleting ? "처리 중..." : "회원탈퇴"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </AuthGuard>
  );
}

/* ─── Shared Components ─── */

// ─── Tab Components ───

type FollowUser = {
  id: string;
  nickname: string | null;
  image: string | null;
  barracksVerified: boolean;
  followedAt: string;
  isFollowingBack: boolean;
};

type ActivityItem = {
  id: string;
  nickname: string;
  reportType: "hack" | "manner";
  status?: string;
  hackTypes?: string[];
  tagType?: string;
  tagTypes?: string[];
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

const HACK_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  SUSPECT: { label: "의심", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
  PROBABLE: { label: "유력", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20" },
  CONFIRMED: { label: "확정", color: "text-white", bg: "bg-toss-red" },
  DISMISSED: { label: "기각", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
};

function ProfileActivityTab() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/activity")
      .then((r) => r.json())
      .then((d) => setActivities(d.activities ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
    return (
      <EmptyState
        icon={<path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
        title="아직 신고 활동이 없습니다"
        description="핵 유저를 발견하면 신고해주세요"
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {activities.map((item) => {
        const thumb = getThumb(item);
        const isHack = item.reportType === "hack";
        const href = isHack ? `/reports/${item.id}` : `/manner/${item.id}`;
        const statusInfo = isHack && item.status ? HACK_STATUS[item.status] : null;

        return (
          <Link key={item.id} href={href} className="group relative aspect-square rounded-2xl overflow-hidden bg-toss-gray-100 dark:bg-toss-gray-800 border border-border/30 hover:shadow-toss-md transition-all hover:-translate-y-0.5">
            {/* 썸네일 또는 그라데이션 배경 */}
            {thumb ? (
              <img src={thumb} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full ${isHack ? "bg-gradient-to-br from-toss-red/10 to-toss-red/5" : "bg-gradient-to-br from-toss-orange/10 to-toss-orange/5"}`} />
            )}

            {/* 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* 유형 뱃지 — 좌상단 */}
            <div className="absolute top-2 left-2">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isHack ? "bg-toss-red/90 text-white" : "bg-toss-orange/90 text-white"}`}>
                {isHack ? "핵" : "비매너"}
              </span>
            </div>

            {/* 상태 뱃지 — 우상단 (핵만) */}
            {statusInfo && (
              <div className="absolute top-2 right-2">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${statusInfo.bg} ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            )}

            {/* 닉네임 — 하단 */}
            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <p className="text-[12px] font-semibold text-white truncate">{item.nickname}</p>
              {item.description && (
                <p className="text-[10px] text-white/70 truncate mt-0.5">{item.description}</p>
              )}
            </div>

            {/* 호버 오버레이 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </Link>
        );
      })}
    </div>
  );
}

type BlacklistItem = { id: string; barracksAddress: string; nickname: string | null; memo: string | null; createdAt: string };

function ProfileBlacklistTab({ onCountChange }: { onCountChange?: (delta: number) => void }) {
  const [entries, setEntries] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addAddress, setAddAddress] = useState("");
  const [addMemo, setAddMemo] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    fetch("/api/blacklist")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    const sn = addAddress.trim().match(/(\d+)/)?.[1];
    if (!sn) { setAddError("병영주소를 입력해주세요"); return; }
    setAdding(true);
    setAddError("");
    try {
      // 크롤링으로 닉네임 조회
      let nickname: string | null = null;
      try {
        const profileRes = await fetch(`/api/barracks/profile?nexonSn=${sn}`);
        const profileData = await profileRes.json();
        if (profileData.found) nickname = profileData.nickname;
      } catch { /* 닉네임 조회 실패해도 추가 진행 */ }

      const res = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barracksAddress: sn, nickname, memo: addMemo.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setEntries((prev) => [{ id: data.id, barracksAddress: sn, nickname, memo: addMemo.trim() || null, createdAt: new Date().toISOString() }, ...prev]);
        onCountChange?.(1);
        setShowAdd(false);
        setAddAddress("");
        setAddMemo("");
      } else {
        setAddError(data?.error || "추가에 실패했습니다");
      }
    } catch { setAddError("서버 연결에 실패했습니다"); }
    finally { setAdding(false); }
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/blacklist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { setEntries((prev) => prev.filter((e) => e.id !== id)); onCountChange?.(-1); }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-toss-gray-100 dark:bg-toss-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* 목록 */}
      {entries.length === 0 && !showAdd ? (
        <div className="py-8">
          <EmptyState
            icon={<><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>}
            title="블랙리스트가 비어있습니다"
            description="의심 유저를 블랙리스트에 추가해보세요"
          />
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const displayName = entry.nickname ?? entry.barracksAddress;
            return (
              <div key={entry.id} className="flex items-center gap-2.5">
                <a
                  href={`https://barracks.sa.nexon.com/${entry.barracksAddress}/match`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 px-4 py-3.5 rounded-2xl bg-card border border-border/30 hover:bg-primary/5 hover:border-primary/20 active:bg-primary/10 transition-colors"
                >
                  <p className="text-[15px] font-semibold text-foreground truncate">{displayName}</p>
                  {entry.memo && <p className="text-[12px] text-toss-gray-400 truncate mt-1">{entry.memo}</p>}
                </a>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="shrink-0 w-16 self-stretch rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 transition-all active:scale-[0.95]"
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 추가 버튼 — 하단 고정 */}
      {!showAdd ? (
        <button onClick={() => setShowAdd(true)} className="w-full mt-4 h-11 rounded-2xl border border-dashed border-border/50 text-[13px] font-medium text-toss-gray-500 hover:text-foreground hover:border-border hover:bg-secondary/30 transition-all flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          직접 추가
        </button>
      ) : (
        <div className="mt-4 bg-card rounded-2xl border border-border/40 p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[13px] font-semibold text-foreground">블랙리스트 추가</p>
            <button onClick={() => setShowAdd(false)} className="text-[12px] text-toss-gray-400 hover:text-foreground transition-colors">취소</button>
          </div>
          <input
            type="text"
            value={addAddress}
            onChange={(e) => { setAddAddress(e.target.value); setAddError(""); }}
            placeholder="병영주소 URL 또는 숫자"
            className="w-full h-10 px-3.5 rounded-xl bg-toss-gray-50 dark:bg-secondary border-none text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="text"
            value={addMemo}
            onChange={(e) => setAddMemo(e.target.value)}
            placeholder="메모 (선택)"
            maxLength={100}
            className="w-full h-10 px-3.5 rounded-xl bg-toss-gray-50 dark:bg-secondary border-none text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
          />
          {addError && <p className="text-[11px] text-toss-red">{addError}</p>}
          <button onClick={handleAdd} disabled={adding || !addAddress.trim()} className="w-full h-10 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-40 transition-all active:scale-[0.98]">
            {adding ? "추가 중..." : "추가"}
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileFollowTab({ type, onCountChange }: { type: "followers" | "following"; onCountChange?: (delta: number) => void }) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/follow/list?type=${type}`)
      .then((res) => res.json())
      .then((data) => { if (data.users) setUsers(data.users); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type]);

  async function handleToggleFollow(userId: string) {
    setTogglingId(userId);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json();
      if (res.ok) {
        if (type === "following" && !data.following) {
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          onCountChange?.(-1);
        } else if (type === "followers") {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId ? { ...u, isFollowingBack: data.following } : u
            )
          );
        }
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
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-24 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800" />
              <div className="h-3 w-16 rounded-lg bg-toss-gray-100 dark:bg-toss-gray-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<><circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 20a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>}
        title={type === "followers" ? "팔로워가 없습니다" : "팔로잉이 없습니다"}
        description={type === "followers" ? "활동을 시작하면 팔로워가 늘어납니다" : "다른 유저를 팔로잉해보세요"}
      />
    );
  }

  return (
    <div className="space-y-1">
      {users.map((user) => {
        const displayName = user.nickname ?? "유저";
        return (
          <div key={user.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/50 transition-colors">
            <Link href={`/profile/${user.id}`} className="shrink-0">
              <div className="w-11 h-11 rounded-full bg-toss-gray-100 dark:bg-toss-gray-800 flex items-center justify-center overflow-hidden">
                {user.image ? (
                  <img src={user.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[15px] font-bold text-toss-gray-500">{displayName.charAt(0)}</span>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link href={`/profile/${user.id}`} className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors truncate">
                  {displayName}
                </Link>
                {user.barracksVerified && (
                  <span className="w-[16px] h-[16px] rounded-full bg-primary flex items-center justify-center shrink-0">
                    <svg width="9" height="9" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                )}
              </div>
              {user.isFollowingBack && type === "followers" && (
                <p className="text-[11px] text-primary font-medium mt-0.5">서로 팔로우</p>
              )}
            </div>
            <button
              onClick={() => handleToggleFollow(user.id)}
              disabled={togglingId === user.id}
              className={`shrink-0 h-8 px-4 rounded-full text-[12px] font-semibold transition-all active:scale-[0.97] ${
                (type === "following" || user.isFollowingBack)
                  ? "bg-primary/10 text-primary border border-primary/20 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:border-red-500/20"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {type === "following" || user.isFollowingBack ? "팔로잉" : "팔로우"}
            </button>
          </div>
        );
      })}
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
      <p className="text-[13px] text-toss-gray-400 mt-1">{description}</p>
    </div>
  );
}

function ConfirmModal({ title, description, cancelText, confirmText, onCancel, onConfirm }: {
  title: string; description: string; cancelText: string; confirmText: string;
  onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-xs bg-card rounded-3xl border border-border/40 shadow-toss-lg p-6 animate-in zoom-in-95 duration-200 text-center">
        <h2 className="text-[18px] font-bold text-foreground mb-2">{title}</h2>
        <p className="text-[14px] text-toss-gray-500 mb-6">{description}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 h-11 rounded-2xl bg-secondary text-[14px] font-semibold text-toss-gray-600 transition-all active:scale-[0.98]">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="flex-1 h-11 rounded-2xl bg-toss-gray-800 dark:bg-toss-gray-200 text-white dark:text-toss-gray-800 text-[14px] font-semibold transition-all active:scale-[0.98]">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
