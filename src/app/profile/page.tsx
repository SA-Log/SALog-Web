"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { TitleBadge, RankBadge, AccuracyBadge } from "@/components/common/title-badge";
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

  // 실제 유저 데이터 (아직 활동 데이터 없으므로 0)
  const name = authUser?.nickname ?? authUser?.name ?? "유저";
  const role = (authUser?.role ?? "USER") as UserRole;
  const hasBarracks = authUser?.barracksVerified ?? false;
  const isCreator = role === "VERIFIED_CREATOR";
  const isStaff = role === "MASTER" || role === "VICE_MASTER" || role === "OPERATOR";
  const isSpecialRole = isCreator || isStaff;
  const roleInfo = ROLE_MAP[role];
  const effectiveIsPublic = isCreator ? true : isProfilePublic;

  // 초기 스탯 (DB 연동 시 교체)
  const kills = 0;
  const deaths = 0;
  const assists = 0;
  const exp = 0;
  const accuracy = 0;
  const totalReports = 0;
  const followerCount = 0;
  const followingCount = 0;

  const rank = getRankForExp(exp);
  const title = getTitleForAccuracy(accuracy);
  const { progress, next } = getExpProgress(exp);

  const tabs: { value: ProfileTab; label: string; count: number }[] = [
    { value: "activity", label: "활동", count: 0 },
    { value: "blacklist", label: "블랙리스트", count: 0 },
    { value: "following", label: "팔로잉", count: followingCount },
    { value: "followers", label: "팔로워", count: followerCount },
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

  const handleSave = () => {
    setBio(editBio);
    if (!isCreator) {
      setIsProfilePublic(editIsPublic);
      localStorage.setItem("salog_profile_public", String(editIsPublic));
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

        <div className="px-5 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Left: Avatar + Name stacked vertically */}
            <div className="flex flex-col items-center sm:items-start gap-2 shrink-0">
              {/* Name + Badges above avatar */}
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <h1 className="text-[20px] sm:text-[22px] font-bold text-foreground truncate">{name}</h1>
                {/* 인증 마크 (트위터 스타일) — 인증된 경우에만 */}
                {hasBarracks && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0" title="서든어택 인증됨">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 6.5l2 2 4-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                {/* 역할 뱃지 */}
                {role !== "USER" && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${roleInfo.bg} ${roleInfo.color}`}>{roleInfo.label}</span>
                )}
                {!effectiveIsPublic && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-500">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="2" y="5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1"/><path d="M3 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                    비공개
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-card border-4 border-card shadow-toss-md flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="프로필" className="w-full h-full object-cover" />
                ) : authUser?.image ? (
                  <img src={authUser.image} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[28px] sm:text-[32px] font-bold text-primary">{name.charAt(0)}</span>
                )}
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              {/* Rank + Title badges */}
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start mb-2">
                <RankBadge rank={rank} size="md" />
                <TitleBadge title={title} size="md" />
              </div>

              {bio && <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-500 mt-1">{bio}</p>}

              {/* Buttons */}
              <div className="flex gap-2 mt-3 justify-center sm:justify-start">
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
                  onClick={() => { setEditBio(bio); setEditIsPublic(isProfilePublic); setIsEditing(true); }}
                  className="h-9 px-4 rounded-xl bg-secondary text-[13px] font-medium text-foreground border border-border btn-secondary"
                >
                  프로필 수정
                </button>
              </div>
            </div>
          </div>

          {/* Stats Row: 명중률, 신고, 팔로워, 팔로잉 */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-5 pt-5 border-t border-border/50">
            <div className="text-center">
              <p className={`text-[16px] sm:text-[20px] font-bold ${getAccuracyColor(accuracy)}`}>
                {accuracy}%
              </p>
              <p className="text-[10px] sm:text-[11px] text-toss-gray-500 mt-0.5">명중률</p>
            </div>
            <div className="text-center">
              <p className="text-[16px] sm:text-[20px] font-bold text-foreground">{totalReports}</p>
              <p className="text-[10px] sm:text-[11px] text-toss-gray-500 mt-0.5">신고</p>
            </div>
            <div className="text-center">
              <p className="text-[16px] sm:text-[20px] font-bold text-foreground">{followerCount}</p>
              <p className="text-[10px] sm:text-[11px] text-toss-gray-500 mt-0.5">팔로워</p>
            </div>
            <div className="text-center">
              <p className="text-[16px] sm:text-[20px] font-bold text-foreground">{followingCount}</p>
              <p className="text-[10px] sm:text-[11px] text-toss-gray-500 mt-0.5">팔로잉</p>
            </div>
          </div>

          {/* K/D/A + EXP */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-toss-red font-semibold">{kills}K</span>
              <span className="text-toss-gray-300">/</span>
              <span className="text-toss-blue font-semibold">{deaths}D</span>
              <span className="text-toss-gray-300">/</span>
              <span className="text-toss-green font-semibold">{assists}A</span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[120px]">
              <span className="text-toss-gray-500">{exp.toLocaleString()} EXP</span>
              <div className="flex-1 h-1.5 rounded-full bg-toss-gray-100 dark:bg-toss-gray-200 overflow-hidden max-w-[100px]">
                <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
              {next && <span className="text-toss-gray-400 text-[11px]">{next.name}까지</span>}
            </div>
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

      {/* Tab Content — Empty States */}
      {activeTab === "activity" && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM10 6v4M10 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
            </svg>
          </div>
          <p className="text-[15px] text-foreground font-semibold">아직 신고 활동이 없습니다</p>
          <p className="text-[13px] text-toss-gray-500 mt-1">핵 유저를 발견하면 신고해주세요</p>
        </div>
      )}
      {activeTab === "blacklist" && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
            </svg>
          </div>
          <p className="text-[15px] text-foreground font-semibold">블랙리스트가 비어있습니다</p>
          <p className="text-[13px] text-toss-gray-500 mt-1">의심 유저를 블랙리스트에 추가해보세요</p>
        </div>
      )}
      {activeTab === "following" && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
              <path d="M3 17a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
            </svg>
          </div>
          <p className="text-[15px] text-foreground font-semibold">팔로잉이 없습니다</p>
          <p className="text-[13px] text-toss-gray-500 mt-1">다른 유저를 팔로잉해보세요</p>
        </div>
      )}
      {activeTab === "followers" && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" className="text-toss-gray-400"/>
              <path d="M3 17a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
            </svg>
          </div>
          <p className="text-[15px] text-foreground font-semibold">팔로워가 없습니다</p>
          <p className="text-[13px] text-toss-gray-500 mt-1">활동을 시작하면 팔로워가 늘어납니다</p>
        </div>
      )}

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
                ) : authUser?.image ? (
                  <img src={authUser.image} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[22px] font-bold text-primary">{name.charAt(0)}</span>
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

            {/* Bio */}
            <div className="mb-5">
              <label className="block text-[13px] font-semibold text-foreground mb-1.5">소개</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value.slice(0, 100))}
                rows={3}
                placeholder="자기소개를 입력해주세요"
                className="w-full px-3 py-2.5 rounded-xl bg-toss-gray-50 dark:bg-secondary border border-border text-[13px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none leading-relaxed placeholder:text-toss-gray-400"
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
                          ? "모든 유저가 내 활동을 볼 수 있습니다"
                          : "나만 내 활동을 볼 수 있습니다"}
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
                  <div className="w-10 h-6 rounded-full bg-toss-gray-300 dark:bg-toss-gray-600 p-0.5 cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm translate-x-0 transition-transform" />
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
