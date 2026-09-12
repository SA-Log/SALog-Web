import type { HackStatus, MannerStatus, MannerTagType, UserRole, VoteType } from "@/generated/prisma/enums";

export type { HackStatus, MannerStatus, MannerTagType, UserRole, VoteType };

export const ROLE_MAP: Record<UserRole, { label: string; color: string; bg: string; order: number }> = {
  MASTER:           { label: "마스터",         color: "text-amber-400",   bg: "bg-amber-400/10",  order: 5 },
  VICE_MASTER:      { label: "부마스터",       color: "text-purple-400",  bg: "bg-purple-400/10", order: 4 },
  OPERATOR:         { label: "운영진",         color: "text-blue-400",    bg: "bg-blue-400/10",   order: 3 },
  VERIFIED_CREATOR: { label: "인증 크리에이터", color: "text-toss-green",  bg: "bg-toss-green/10", order: 2 },
  USER:             { label: "일반",           color: "text-toss-gray-500", bg: "bg-secondary",   order: 1 },
};

export const HACK_STATUS_MAP: Record<HackStatus, { label: string; color: string; bg: string }> = {
  SUSPECT: { label: "핵 의심", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
  PROBABLE: { label: "핵 유력", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20" },
  CONFIRMED: { label: "핵 확정", color: "text-white", bg: "bg-toss-red" },
  DISMISSED: { label: "기각", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
};

export const MANNER_STATUS_MAP: Record<MannerStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: "검토 중", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
  CONFIRMED: { label: "비매너 확정", color: "text-white", bg: "bg-toss-red" },
  REJECTED: { label: "반려", color: "text-toss-gray-600 dark:text-toss-gray-400", bg: "bg-toss-gray-100 dark:bg-toss-gray-700" },
};

export const MANNER_TAG_MAP: Record<MannerTagType, { label: string; emoji: string; color: string; bg: string }> = {
  VERBAL_ABUSE: { label: "욕설", emoji: "🤬", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-500/20" },
  BLOCKING: { label: "길막", emoji: "🚧", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
  GRIEFING: { label: "트롤링", emoji: "👺", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/20" },
  AFK: { label: "잠수", emoji: "💤", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/20" },
  TEAM_KILL: { label: "섬광탄 방해", emoji: "💥", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20" },
  OTHER: { label: "기타", emoji: "⚠️", color: "text-gray-700 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-500/20" },
};
