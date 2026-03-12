"use client";

import { useState, useRef } from "react";
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
  const totalReports = 0;
  const followerCount = 0;
  const followingCount = 0;

  const rank = getRankForExp(exp);
  const title = getTitleForAccuracy(accuracy);
  const { progress, next } = getExpProgress(exp);

  const tabs: { value: ProfileTab; label: string; count: number }[] = [
    { value: "activity", label: "활동", count: 0 },
    { value: "blacklist", label: "블랙리스트", count: 0 },
    { value: "followers", label: "팔로워", count: followerCount },
    { value: "following", label: "팔로잉", count: followingCount },
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
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

  const avatarSrc = avatarPreview ?? authUser?.image ?? null;

  return (
    <AuthGuard>
    <div className="mx-auto max-w-screen-md px-5 py-8">

      {/* ─── Hero Card ─── */}
      <div className="bg-card rounded-3xl border border-border/40 shadow-toss overflow-hidden">

        {/* Role Banner */}
        {isSpecialRole && (
          <div className={`px-6 py-2 ${roleInfo.bg} flex items-center gap-2`}>
            <span className={`text-[11px] font-bold tracking-wide uppercase ${roleInfo.color}`}>{roleInfo.label}</span>
            <span className="text-[11px] text-toss-gray-500">{isStaff ? "SALog 운영팀" : "공식 인증 크리에이터"}</span>
          </div>
        )}

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
            {!isCreator && (
              <Link href="/creator/apply"
                className="h-9 px-5 rounded-full bg-toss-green/10 text-toss-green text-[12px] font-semibold border border-toss-green/20 flex items-center gap-1.5 transition-all hover:bg-toss-green/15 active:scale-[0.97]">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                크리에이터 신청
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
        {activeTab === "activity" && (
          <EmptyState
            icon={<path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
            title="아직 신고 활동이 없습니다"
            description="핵 유저를 발견하면 신고해주세요"
          />
        )}
        {activeTab === "blacklist" && (
          <EmptyState
            icon={<><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>}
            title="블랙리스트가 비어있습니다"
            description="의심 유저를 블랙리스트에 추가해보세요"
          />
        )}
        {activeTab === "following" && (
          <EmptyState
            icon={<><circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 20a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>}
            title="팔로잉이 없습니다"
            description="다른 유저를 팔로잉해보세요"
          />
        )}
        {activeTab === "followers" && (
          <EmptyState
            icon={<><circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 20a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>}
            title="팔로워가 없습니다"
            description="활동을 시작하면 팔로워가 늘어납니다"
          />
        )}
      </div>

      {/* ─── Footer Actions ─── */}
      <div className="pt-6 border-t border-border/30">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="text-[13px] font-medium text-toss-gray-400 hover:text-toss-gray-600 transition-colors">
          로그아웃
        </button>
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
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="프로필" className="w-full h-full object-cover" />
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
                  {avatarPreview && (
                    <>
                      <span className="text-toss-gray-300">|</span>
                      <button
                        onClick={() => { setAvatarPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
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
                      <div className="w-[50px] h-[30px] rounded-full bg-primary p-[3px] cursor-pointer">
                        <div className="w-6 h-6 rounded-full bg-white shadow-sm translate-x-5 transition-transform duration-200" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-toss-gray-50 dark:bg-secondary border border-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-medium text-foreground">팔로잉 블랙리스트 알림</p>
                        <p className="text-[12px] text-toss-gray-400 mt-0.5">팔로잉한 유저가 블랙리스트를 추가하면 알림</p>
                      </div>
                      <div className="w-[50px] h-[30px] rounded-full bg-toss-gray-300 dark:bg-toss-gray-600 p-[3px] cursor-pointer">
                        <div className="w-6 h-6 rounded-full bg-white shadow-sm translate-x-0 transition-transform duration-200" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-12 rounded-2xl bg-secondary text-[15px] font-semibold text-toss-gray-600 transition-all hover:bg-secondary/80 active:scale-[0.98]"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 h-12 rounded-2xl bg-primary text-white text-[15px] font-semibold transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  저장
                </button>
              </div>

              {/* 회원탈퇴 */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => { setIsEditing(false); setShowDeleteConfirm(true); }}
                  className="text-[12px] text-toss-gray-400 hover:text-toss-gray-500 transition-colors"
                >
                  회원탈퇴
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
          onConfirm={() => { logout(); router.push("/login"); }}
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

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                className="flex-1 h-12 rounded-2xl bg-secondary text-[15px] font-semibold text-toss-gray-600 transition-all active:scale-[0.98]">
                취소
              </button>
              <button
                disabled={deleteInput !== "탈퇴합니다"}
                onClick={() => { logout(); router.push("/login"); }}
                className={`flex-1 h-12 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98] ${
                  deleteInput === "탈퇴합니다"
                    ? "bg-toss-red text-white"
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

/* ─── Shared Components ─── */

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
