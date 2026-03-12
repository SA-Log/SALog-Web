export type HackStatus = "SUSPECT" | "PROBABLE" | "CONFIRMED" | "DISMISSED";
export type VoteType = "AGREE" | "DISAGREE";
export type MannerTagType = "BLOCKING" | "VERBAL_ABUSE" | "GRIEFING" | "AFK" | "TEAM_KILL" | "OTHER";
export type UserRole = "MASTER" | "VICE_MASTER" | "OPERATOR" | "VERIFIED_CREATOR" | "USER";

export const ROLE_MAP: Record<UserRole, { label: string; color: string; bg: string; order: number }> = {
  MASTER:           { label: "마스터",         color: "text-amber-400",   bg: "bg-amber-400/10",  order: 5 },
  VICE_MASTER:      { label: "부마스터",       color: "text-purple-400",  bg: "bg-purple-400/10", order: 4 },
  OPERATOR:         { label: "운영진",         color: "text-blue-400",    bg: "bg-blue-400/10",   order: 3 },
  VERIFIED_CREATOR: { label: "인증 크리에이터", color: "text-toss-green",  bg: "bg-toss-green/10", order: 2 },
  USER:             { label: "일반",           color: "text-toss-gray-500", bg: "bg-secondary",   order: 1 },
};

// ==================== 명중률 & K/D 시스템 ====================

export interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  role: UserRole;
  // 병영수첩 연동
  barracksAddress?: string;  // 병영수첩 주소 (선택적 등록)
  // 명중률 시스템
  kills: number;          // 핵 확정된 신고 수
  deaths: number;         // 기각 + 반대표 우세 신고 수
  assists: number;        // 투표/댓글 활동
  accuracy: number;       // 명중률 (%) = kills / (kills + deaths) * 100
  title: UserTitle;       // 칭호 (명중률 기반)
  // 계급 시스템
  exp: number;            // 경험치 (절대 감소 안 함)
  rank: MilitaryRank;     // 계급 (경험치 기반)
  // 활동
  totalReports: number;
  totalVotes: number;
  totalComments: number;
  streak: number;         // 연속 출석 일수
  joinedAt: string;
  // 크리에이터 링크 (VERIFIED_CREATOR 전용)
  broadcastUrl?: string;   // 방송국 주소 (치지직, SOOP 등)
  youtubeUrl?: string;     // 유튜브 채널
  otherLinks?: { label: string; url: string }[];  // 기타 링크
}

// ==================== 칭호 (명중률 기반) ====================

export interface UserTitle {
  id: string;
  name: string;
  minAccuracy: number;
  // 스타일링 (화려한 그라데이션)
  gradient: string;
  glow: string;
  textClass: string;
  tier: "legendary" | "epic" | "rare" | "uncommon" | "common" | "penalty";
}

export const USER_TITLES: UserTitle[] = [
  {
    id: "sniper", name: "저격수", minAccuracy: 90, tier: "legendary",
    gradient: "from-amber-300 via-yellow-400 to-amber-500",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.5)]",
    textClass: "text-amber-400",
  },
  {
    id: "marksman", name: "특등사수", minAccuracy: 75, tier: "epic",
    gradient: "from-violet-400 via-purple-500 to-fuchsia-500",
    glow: "shadow-[0_0_10px_rgba(168,85,247,0.4)]",
    textClass: "text-purple-400",
  },
  {
    id: "sharpshooter", name: "상급사수", minAccuracy: 60, tier: "rare",
    gradient: "from-blue-400 via-cyan-400 to-blue-500",
    glow: "shadow-[0_0_8px_rgba(59,130,246,0.35)]",
    textClass: "text-blue-400",
  },
  {
    id: "rifleman", name: "사수", minAccuracy: 45, tier: "uncommon",
    gradient: "from-emerald-400 to-teal-500",
    glow: "",
    textClass: "text-emerald-500",
  },
  {
    id: "assistant_rifleman", name: "부사수", minAccuracy: 30, tier: "common",
    gradient: "from-slate-400 to-slate-500",
    glow: "",
    textClass: "text-slate-500",
  },
  {
    id: "meat_shield", name: "고기방패", minAccuracy: 0, tier: "penalty",
    gradient: "from-red-400 to-red-600",
    glow: "",
    textClass: "text-red-400",
  },
];

export function getTitleForAccuracy(accuracy: number): UserTitle {
  return USER_TITLES.find((t) => accuracy >= t.minAccuracy) ?? USER_TITLES[USER_TITLES.length - 1];
}

// ==================== 계급 (경험치 기반, 감소 없음) ====================

export interface MilitaryRank {
  id: string;
  name: string;
  shortName: string;  // 뱃지에 표시할 짧은 이름
  minExp: number;
  order: number;
  category: "enlisted" | "nco" | "officer" | "general"; // 병사/부사관/장교/장성
  playerLimit?: number; // 장성급 인원 제한
}

// 서든어택 계급 체계 (내림차순: 높은 계급이 먼저)
export const MILITARY_RANKS: MilitaryRank[] = [
  // 장성 (인원 제한)
  { id: "wonsu",       name: "원수",           shortName: "원수",      minExp: 25375000, order: 60, category: "general", playerLimit: 1 },
  { id: "buwonsu",     name: "부원수",         shortName: "부원수",    minExp: 20375000, order: 59, category: "general", playerLimit: 5 },
  { id: "daejang",     name: "대장",           shortName: "대장",      minExp: 16375000, order: 58, category: "general", playerLimit: 300 },
  { id: "jungjang",    name: "중장",           shortName: "중장",      minExp: 13375000, order: 57, category: "general", playerLimit: 3000 },
  { id: "sojang",      name: "소장",           shortName: "소장",      minExp: 11375000, order: 56, category: "general", playerLimit: 5000 },
  { id: "junjang",     name: "준장",           shortName: "준장",      minExp: 10375000, order: 55, category: "general", playerLimit: 10000 },
  // 대령
  { id: "daeryeong6",  name: "대령 6호봉",     shortName: "대령",      minExp: 9875000,  order: 54, category: "officer" },
  { id: "daeryeong5",  name: "대령 5호봉",     shortName: "대령",      minExp: 9375000,  order: 53, category: "officer" },
  { id: "daeryeong4",  name: "대령 4호봉",     shortName: "대령",      minExp: 8875000,  order: 52, category: "officer" },
  { id: "daeryeong3",  name: "대령 3호봉",     shortName: "대령",      minExp: 8375000,  order: 51, category: "officer" },
  { id: "daeryeong2",  name: "대령 2호봉",     shortName: "대령",      minExp: 7875000,  order: 50, category: "officer" },
  { id: "daeryeong1",  name: "대령 1호봉",     shortName: "대령",      minExp: 7375000,  order: 49, category: "officer" },
  // 중령
  { id: "jungryeong6", name: "중령 6호봉",     shortName: "중령",      minExp: 6975000,  order: 48, category: "officer" },
  { id: "jungryeong5", name: "중령 5호봉",     shortName: "중령",      minExp: 6575000,  order: 47, category: "officer" },
  { id: "jungryeong4", name: "중령 4호봉",     shortName: "중령",      minExp: 6175000,  order: 46, category: "officer" },
  { id: "jungryeong3", name: "중령 3호봉",     shortName: "중령",      minExp: 5775000,  order: 45, category: "officer" },
  { id: "jungryeong2", name: "중령 2호봉",     shortName: "중령",      minExp: 5375000,  order: 44, category: "officer" },
  { id: "jungryeong1", name: "중령 1호봉",     shortName: "중령",      minExp: 4975000,  order: 43, category: "officer" },
  // 소령
  { id: "soryeong6",   name: "소령 6호봉",     shortName: "소령",      minExp: 4675000,  order: 42, category: "officer" },
  { id: "soryeong5",   name: "소령 5호봉",     shortName: "소령",      minExp: 4375000,  order: 41, category: "officer" },
  { id: "soryeong4",   name: "소령 4호봉",     shortName: "소령",      minExp: 4075000,  order: 40, category: "officer" },
  { id: "soryeong3",   name: "소령 3호봉",     shortName: "소령",      minExp: 3775000,  order: 39, category: "officer" },
  { id: "soryeong2",   name: "소령 2호봉",     shortName: "소령",      minExp: 3475000,  order: 38, category: "officer" },
  { id: "soryeong1",   name: "소령 1호봉",     shortName: "소령",      minExp: 3175000,  order: 37, category: "officer" },
  // 대위
  { id: "daewi6",      name: "대위 6호봉",     shortName: "대위",      minExp: 2975000,  order: 36, category: "officer" },
  { id: "daewi5",      name: "대위 5호봉",     shortName: "대위",      minExp: 2775000,  order: 35, category: "officer" },
  { id: "daewi4",      name: "대위 4호봉",     shortName: "대위",      minExp: 2575000,  order: 34, category: "officer" },
  { id: "daewi3",      name: "대위 3호봉",     shortName: "대위",      minExp: 2375000,  order: 33, category: "officer" },
  { id: "daewi2",      name: "대위 2호봉",     shortName: "대위",      minExp: 2175000,  order: 32, category: "officer" },
  { id: "daewi1",      name: "대위 1호봉",     shortName: "대위",      minExp: 1975000,  order: 31, category: "officer" },
  // 중위
  { id: "jungwi6",     name: "중위 6호봉",     shortName: "중위",      minExp: 1825000,  order: 30, category: "officer" },
  { id: "jungwi5",     name: "중위 5호봉",     shortName: "중위",      minExp: 1675000,  order: 29, category: "officer" },
  { id: "jungwi4",     name: "중위 4호봉",     shortName: "중위",      minExp: 1525000,  order: 28, category: "officer" },
  { id: "jungwi3",     name: "중위 3호봉",     shortName: "중위",      minExp: 1375000,  order: 27, category: "officer" },
  { id: "jungwi2",     name: "중위 2호봉",     shortName: "중위",      minExp: 1225000,  order: 26, category: "officer" },
  { id: "jungwi1",     name: "중위 1호봉",     shortName: "중위",      minExp: 1075000,  order: 25, category: "officer" },
  // 소위
  { id: "sowi6",       name: "소위 6호봉",     shortName: "소위",      minExp: 975000,   order: 24, category: "officer" },
  { id: "sowi5",       name: "소위 5호봉",     shortName: "소위",      minExp: 875000,   order: 23, category: "officer" },
  { id: "sowi4",       name: "소위 4호봉",     shortName: "소위",      minExp: 775000,   order: 22, category: "officer" },
  { id: "sowi3",       name: "소위 3호봉",     shortName: "소위",      minExp: 675000,   order: 21, category: "officer" },
  { id: "sowi2",       name: "소위 2호봉",     shortName: "소위",      minExp: 575000,   order: 20, category: "officer" },
  { id: "sowi1",       name: "소위 1호봉",     shortName: "소위",      minExp: 475000,   order: 19, category: "officer" },
  // 상사
  { id: "sangsa5",     name: "상사 5호봉",     shortName: "상사",      minExp: 425000,   order: 18, category: "nco" },
  { id: "sangsa4",     name: "상사 4호봉",     shortName: "상사",      minExp: 375000,   order: 17, category: "nco" },
  { id: "sangsa3",     name: "상사 3호봉",     shortName: "상사",      minExp: 325000,   order: 16, category: "nco" },
  { id: "sangsa2",     name: "상사 2호봉",     shortName: "상사",      minExp: 275000,   order: 15, category: "nco" },
  { id: "sangsa1",     name: "상사 1호봉",     shortName: "상사",      minExp: 225000,   order: 14, category: "nco" },
  // 중사
  { id: "jungsa4",     name: "중사 4호봉",     shortName: "중사",      minExp: 195000,   order: 13, category: "nco" },
  { id: "jungsa3",     name: "중사 3호봉",     shortName: "중사",      minExp: 165000,   order: 12, category: "nco" },
  { id: "jungsa2",     name: "중사 2호봉",     shortName: "중사",      minExp: 135000,   order: 11, category: "nco" },
  { id: "jungsa1",     name: "중사 1호봉",     shortName: "중사",      minExp: 105000,   order: 10, category: "nco" },
  // 하사
  { id: "hasa3",       name: "하사 3호봉",     shortName: "하사",      minExp: 85000,    order: 9,  category: "nco" },
  { id: "hasa2",       name: "하사 2호봉",     shortName: "하사",      minExp: 65000,    order: 8,  category: "nco" },
  { id: "hasa1",       name: "하사 1호봉",     shortName: "하사",      minExp: 45000,    order: 7,  category: "nco" },
  // 병사
  { id: "byeongjang",  name: "병장",           shortName: "병장",      minExp: 30000,    order: 6,  category: "enlisted" },
  { id: "sangbyeong",  name: "상병",           shortName: "상병",      minExp: 18000,    order: 5,  category: "enlisted" },
  { id: "ilbyeong",    name: "일병",           shortName: "일병",      minExp: 9000,     order: 4,  category: "enlisted" },
  { id: "ibyeong",     name: "이병",           shortName: "이병",      minExp: 3000,     order: 3,  category: "enlisted" },
  { id: "hunryeon",    name: "훈련병",         shortName: "훈련병",    minExp: 0,        order: 1,  category: "enlisted" },
];

export function getRankForExp(exp: number): MilitaryRank {
  return MILITARY_RANKS.find((r) => exp >= r.minExp) ?? MILITARY_RANKS[MILITARY_RANKS.length - 1];
}

/** 다음 계급까지 남은 경험치 비율 (0~1) */
export function getExpProgress(exp: number): { current: MilitaryRank; next: MilitaryRank | null; progress: number } {
  const current = getRankForExp(exp);
  const currentIdx = MILITARY_RANKS.indexOf(current);
  const next = currentIdx > 0 ? MILITARY_RANKS[currentIdx - 1] : null;
  if (!next) return { current, next: null, progress: 1 };
  const progress = (exp - current.minExp) / (next.minExp - current.minExp);
  return { current, next, progress: Math.min(progress, 1) };
}

// ==================== 경험치 획득 ====================

/** 일일 신고 등록 제한 */
export const DAILY_REPORT_LIMIT = 5;

export const EXP_TABLE = {
  dailyCheckIn: 10,
  streak3: 5,
  streak7: 15,
  streak30: 50,
  streak90: 150,
  streak365: 500,
  // 신고 확정 시 기여도 분배 (등록 자체는 0 EXP, 확정/유력 시에만 지급)
  reporterConfirmed: 20,      // 최초 신고자 → 핵 확정
  reporterProbable: 8,        // 최초 신고자 → 핵 유력
  contributorConfirmed: 15,   // 추가 증거 제출자 → 핵 확정
  contributorProbable: 5,     // 추가 증거 제출자 → 핵 유력
  vote: 3,              // Assist: 투표 참여
  comment: 2,           // Assist: 댓글 작성
  mannerTag: 2,         // Assist: 비매너 신고 등록
};

// ==================== 명중률 색상 ====================

export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 90) return "text-amber-400";
  if (accuracy >= 75) return "text-purple-400";
  if (accuracy >= 60) return "text-blue-400";
  if (accuracy >= 45) return "text-emerald-500";
  if (accuracy >= 30) return "text-toss-gray-500";
  return "text-red-400";
}

// ==================== 데이터 인터페이스 ====================

export interface HackReport {
  id: string;
  barracksAddress: string;
  nickname: string;
  status: HackStatus;
  description: string;
  evidenceUrl: string | null;
  youtubeUrl: string | null;
  reporterId: string;
  reporterName: string;
  reporterImage: string | null;
  reporterAccuracy: number;
  reporterKills: number;
  reporterDeaths: number;
  reporterTitle: UserTitle;
  reporterRank: MilitaryRank;
  createdAt: string;
  agreeCount: number;
  disagreeCount: number;
  unsureCount: number;
  commentCount: number;
  nicknameHistory: { oldNickname: string; newNickname: string; detectedAt: string }[];
  adminVerdict?: {
    status: HackStatus;
    reason: string;
    adminName: string;
    adminRole: UserRole;
    decidedAt: string;
  };
}

export interface MannerTag {
  id: string;
  barracksAddress: string;
  nickname: string;
  tagType: MannerTagType;
  description: string;
  evidenceUrl: string | null;
  youtubeUrl: string | null;
  reporterId: string;
  reporterName: string;
  reporterImage: string | null;
  reporterAccuracy: number;
  reporterKills: number;
  reporterDeaths: number;
  reporterTitle: UserTitle;
  reporterRank: MilitaryRank;
  createdAt: string;
  agreeCount: number;
  disagreeCount: number;
  commentCount: number;
  nicknameHistory: { oldNickname: string; newNickname: string; detectedAt: string }[];
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userImage: string | null;
  userAccuracy: number;
  userTitle: UserTitle;
  userRank: MilitaryRank;
  createdAt: string;
}

// ==================== 상수 맵 ====================

export const HACK_STATUS_MAP: Record<HackStatus, { label: string; color: string; bg: string }> = {
  SUSPECT: { label: "핵 의심", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
  PROBABLE: { label: "핵 유력", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20" },
  CONFIRMED: { label: "핵 확정", color: "text-white", bg: "bg-toss-red" },
  DISMISSED: { label: "기각", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
};

export const MANNER_TAG_MAP: Record<MannerTagType, { label: string; emoji: string; color: string; bg: string }> = {
  VERBAL_ABUSE: { label: "욕설", emoji: "🤬", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-500/20" },
  BLOCKING: { label: "길막", emoji: "🚧", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
  GRIEFING: { label: "트롤링", emoji: "👺", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/20" },
  AFK: { label: "잠수", emoji: "💤", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/20" },
  TEAM_KILL: { label: "섬광탄 방해", emoji: "💥", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20" },
  OTHER: { label: "기타", emoji: "⚠️", color: "text-gray-700 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-500/20" },
};

// ==================== 목 유저 ====================

function makeUser(
  id: string, name: string, role: UserRole, kills: number, deaths: number, assists: number,
  exp: number, totalReports: number, totalVotes: number, totalComments: number,
  streak: number, joinedAt: string, barracksAddress?: string,
): UserProfile {
  const accuracy = (kills + deaths) > 0 ? Math.round((kills / (kills + deaths)) * 100) : 0;
  return {
    id, name, image: null, role, barracksAddress, kills, deaths, assists, accuracy,
    title: getTitleForAccuracy(accuracy),
    exp, rank: getRankForExp(exp),
    totalReports, totalVotes, totalComments, streak, joinedAt,
  };
}

export const mockUsers: UserProfile[] = [
  makeUser("u1", "서든경찰",       "MASTER",            34, 3, 215, 523000,  37, 215, 89, 23, "2025-06-15T00:00:00Z", "https://barracks.sa.nexon.com/1443173862/match"),
  {
    ...makeUser("u2", "서든어택BJ_철구", "VERIFIED_CREATOR",  38, 4, 180, 1250000, 42, 180, 67, 45, "2025-07-01T00:00:00Z", "https://barracks.sa.nexon.com/1587234901/detail"),
    broadcastUrl: "https://chzzk.naver.com/@suddenBJ",
    youtubeUrl: "https://www.youtube.com/@suddenBJ",
    otherLinks: [
      { label: "디스코드", url: "https://discord.gg/suddenBJ" },
    ],
  },
  makeUser("u3", "핵감별사",       "OPERATOR",          16, 4, 156, 280000,  20, 156, 43, 12, "2025-08-20T00:00:00Z"),
  makeUser("u4", "서든워치",       "USER",              12, 5, 134, 110000,  17, 134, 55, 8,  "2025-09-10T00:00:00Z", "https://barracks.sa.nexon.com/1398756412/detail"),
  makeUser("u5", "정의구현",       "USER",               5, 8, 88,  22000,   13, 88,  22, 5,  "2025-10-05T00:00:00Z"),
  makeUser("u6", "신고맨",         "USER",               2, 16, 45, 5500,    18, 45,  12, 2,  "2025-11-12T00:00:00Z"),
  makeUser("u7", "평화주의자",     "USER",               5, 2, 102, 48000,   7,  102, 38, 15, "2025-09-25T00:00:00Z"),
  makeUser("u8", "서든고인물",     "VICE_MASTER",       10, 1, 198, 680000,  11, 198, 112, 60, "2025-06-01T00:00:00Z", "https://barracks.sa.nexon.com/1201345678/match"),
];

// ==================== 목 신고 ====================

function getReporter(id: string) {
  const u = mockUsers.find((u) => u.id === id)!;
  return {
    reporterId: u.id, reporterName: u.name, reporterImage: u.image,
    reporterAccuracy: u.accuracy, reporterKills: u.kills, reporterDeaths: u.deaths,
    reporterTitle: u.title, reporterRank: u.rank,
  };
}

export const mockHackReports: HackReport[] = [
  {
    id: "1", barracksAddress: "https://barracks.sa.nexon.com/1443173862/match", nickname: "ProGamer_99", status: "CONFIRMED",
    description: "에임핵 사용. 벽 뒤 적을 정확히 조준하는 장면이 반복적으로 포착됨. 킬캠에서 비정상적인 에임 스냅이 확인됨.",
    evidenceUrl: null, youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ...getReporter("u1"),
    createdAt: "2026-03-08T14:30:00Z", agreeCount: 47, disagreeCount: 3, unsureCount: 5, commentCount: 12,
    nicknameHistory: [
      { oldNickname: "HackMaster_01", newNickname: "NormalPlayer", detectedAt: "2026-02-15T08:00:00Z" },
      { oldNickname: "NormalPlayer", newNickname: "ProGamer_99", detectedAt: "2026-03-01T12:00:00Z" },
    ],
    adminVerdict: {
      status: "CONFIRMED", reason: "다수 유저 증거 제출, 에임핵 확정. 킬캠 영상에서 벽 뒤 적을 정확히 조준하는 비정상적 패턴이 반복적으로 확인됨.",
      adminName: "서든경찰", adminRole: "MASTER", decidedAt: "2026-03-08T16:00:00Z",
    },
  },
  {
    id: "2", barracksAddress: "https://barracks.sa.nexon.com/1587234901/detail", nickname: "그림자킬러", status: "PROBABLE",
    description: "월핵 의심. 벽 너머 적 위치를 미리 파악하고 프리파이어하는 패턴이 다수 확인됨.",
    evidenceUrl: null, youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ...getReporter("u1"),
    createdAt: "2026-03-07T09:15:00Z", agreeCount: 31, disagreeCount: 8, unsureCount: 12, commentCount: 7,
    nicknameHistory: [
      { oldNickname: "ShaDowKiLL3r", newNickname: "그림자킬러", detectedAt: "2026-02-20T06:00:00Z" },
    ],
    adminVerdict: {
      status: "PROBABLE", reason: "월핵 증거 영상 확인, 투표 찬성 우세. 추가 증거 수집 중.",
      adminName: "서든경찰", adminRole: "MASTER", decidedAt: "2026-03-07T10:00:00Z",
    },
  },
  {
    id: "3", barracksAddress: "https://barracks.sa.nexon.com/1325098741/match", nickname: "은빛총알", status: "SUSPECT",
    description: "스피드핵 의심. 비정상적인 이동 속도로 맵을 횡단하는 장면이 포착됨.",
    evidenceUrl: null, youtubeUrl: null,
    ...getReporter("u1"),
    createdAt: "2026-03-06T18:45:00Z", agreeCount: 14, disagreeCount: 11, unsureCount: 18, commentCount: 5,
    nicknameHistory: [],
  },
  {
    id: "4", barracksAddress: "https://barracks.sa.nexon.com/1678452390/detail", nickname: "무적전사", status: "CONFIRMED",
    description: "에임핵 + 월핵 복합 사용. 다수의 유튜버가 동일 유저를 신고. 킬캠에서 벽 관통 에임이 명확히 확인됨.",
    evidenceUrl: null, youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ...getReporter("u2"),
    createdAt: "2026-03-05T11:20:00Z", agreeCount: 89, disagreeCount: 2, unsureCount: 3, commentCount: 23,
    nicknameHistory: [
      { oldNickname: "킬링머신", newNickname: "평범한유저", detectedAt: "2026-01-10T04:00:00Z" },
      { oldNickname: "평범한유저", newNickname: "새출발123", detectedAt: "2026-02-05T08:00:00Z" },
      { oldNickname: "새출발123", newNickname: "무적전사", detectedAt: "2026-03-01T06:00:00Z" },
    ],
    adminVerdict: {
      status: "CONFIRMED", reason: "에임핵 + 월핵 복합 사용 확정. 다수 유튜버의 킬캠 영상에서 벽 관통 에임이 명확히 확인됨.",
      adminName: "서든경찰", adminRole: "MASTER", decidedAt: "2026-03-06T09:00:00Z",
    },
  },
  {
    id: "5", barracksAddress: "https://barracks.sa.nexon.com/1892347156/workmanship", nickname: "불꽃사수", status: "PROBABLE",
    description: "오토에임 의심. 모든 사격이 헤드샷으로 연결되며 비인간적인 반응속도를 보임.",
    evidenceUrl: null, youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ...getReporter("u1"),
    createdAt: "2026-03-04T16:00:00Z", agreeCount: 22, disagreeCount: 5, unsureCount: 8, commentCount: 9,
    nicknameHistory: [
      { oldNickname: "HeadHunter_X", newNickname: "불꽃사수", detectedAt: "2026-02-28T10:00:00Z" },
    ],
    adminVerdict: {
      status: "PROBABLE", reason: "오토에임 킬캠 영상 다수 확인. 추가 증거 수집 및 모니터링 진행 중.",
      adminName: "서든고인물", adminRole: "VICE_MASTER", decidedAt: "2026-03-05T12:00:00Z",
    },
  },
  {
    id: "6", barracksAddress: "https://barracks.sa.nexon.com/1234567890/match", nickname: "초보입니다", status: "DISMISSED",
    description: "에임핵 사용하는 것 같습니다. 킬캠에서 에임이 이상하게 움직이는데 실력인지 핵인지 판단 부탁드립니다.",
    evidenceUrl: null, youtubeUrl: null,
    ...getReporter("u6"),
    createdAt: "2026-03-03T20:30:00Z", agreeCount: 5, disagreeCount: 42, unsureCount: 7, commentCount: 15,
    nicknameHistory: [],
    adminVerdict: {
      status: "DISMISSED", reason: "정상 플레이 판정. 증거 불충분, 반대 투표 압도적.",
      adminName: "핵감별사", adminRole: "OPERATOR", decidedAt: "2026-03-04T09:00:00Z",
    },
  },
];

export const mockMannerTags: MannerTag[] = [
  {
    id: "m1", barracksAddress: "https://barracks.sa.nexon.com/1567823401/detail", nickname: "독설가", tagType: "VERBAL_ABUSE",
    description: "랭크 매치에서 팀원에게 지속적으로 욕설 및 인신공격. 게임 내 채팅과 음성 모두에서 심한 비속어를 사용.",
    evidenceUrl: null, youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ...getReporter("u7"), createdAt: "2026-03-09T10:00:00Z",
    agreeCount: 23, disagreeCount: 2, commentCount: 8,
    nicknameHistory: [
      { oldNickname: "착한사람", newNickname: "독설가", detectedAt: "2026-02-20T08:00:00Z" },
    ],
  },
  {
    id: "m2", barracksAddress: "https://barracks.sa.nexon.com/1456789023/match", nickname: "길막전문", tagType: "BLOCKING",
    description: "좁은 통로에서 의도적으로 길막하여 아군 이동 방해. 3판 연속 동일 행동 확인됨.",
    evidenceUrl: null, youtubeUrl: null,
    ...getReporter("u1"), createdAt: "2026-03-08T15:30:00Z",
    agreeCount: 15, disagreeCount: 4, commentCount: 5,
    nicknameHistory: [],
  },
  {
    id: "m3", barracksAddress: "https://barracks.sa.nexon.com/1345678912/detail", nickname: "트롤장인", tagType: "GRIEFING",
    description: "랭크전에서 의도적으로 적에게 위치 노출, 고의적 패배 유도. 아군 위치를 채팅으로 알려줌.",
    evidenceUrl: null, youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ...getReporter("u3"), createdAt: "2026-03-07T22:00:00Z",
    agreeCount: 31, disagreeCount: 3, commentCount: 11,
    nicknameHistory: [
      { oldNickname: "트롤마스터", newNickname: "순수한유저", detectedAt: "2026-01-15T06:00:00Z" },
      { oldNickname: "순수한유저", newNickname: "트롤장인", detectedAt: "2026-02-28T10:00:00Z" },
    ],
  },
  {
    id: "m4", barracksAddress: "https://barracks.sa.nexon.com/1789012345/saduo", nickname: "잠수왕", tagType: "AFK",
    description: "게임 시작 후 30초 만에 잠수. 3판 연속 동일 행동. 팀원들이 4:5로 불리하게 플레이해야 했음.",
    evidenceUrl: null, youtubeUrl: null,
    ...getReporter("u5"), createdAt: "2026-03-06T14:00:00Z",
    agreeCount: 8, disagreeCount: 6, commentCount: 3,
    nicknameHistory: [],
  },
  {
    id: "m5", barracksAddress: "https://barracks.sa.nexon.com/1623456789/match", nickname: "팀킬러", tagType: "TEAM_KILL",
    description: "시작하자마자 아군에게 섬광탄 투척. 의도적으로 아군 시야 방해 반복. 경고해도 계속 동일 행동.",
    evidenceUrl: null, youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ...getReporter("u6"), createdAt: "2026-03-05T08:00:00Z",
    agreeCount: 19, disagreeCount: 1, commentCount: 6,
    nicknameHistory: [
      { oldNickname: "팀플레이어", newNickname: "팀킬러", detectedAt: "2026-03-01T12:00:00Z" },
    ],
  },
];

function getCommentUser(id: string) {
  const u = mockUsers.find((u) => u.id === id)!;
  return { userId: u.id, userName: u.name, userImage: u.image, userAccuracy: u.accuracy, userTitle: u.title, userRank: u.rank };
}

export const mockComments: Comment[] = [
  { id: "c1", content: "저도 이 유저한테 당했습니다. 킬캠 보면 확실히 에임핵입니다.", ...getCommentUser("u7"), createdAt: "2026-03-08T15:00:00Z" },
  { id: "c2", content: "월핵도 같이 쓰는 것 같아요. 벽 뒤에 숨어있는데 정확히 프리파이어 하더라고요.", ...getCommentUser("u4"), createdAt: "2026-03-08T16:30:00Z" },
  { id: "c3", content: "3개월 전에도 다른 닉네임으로 신고된 적 있는 유저네요. 닉변 이력 보면 확실합니다.", ...getCommentUser("u8"), createdAt: "2026-03-09T09:00:00Z" },
];

export const mockMannerComments: Comment[] = [
  { id: "mc1", content: "저도 같은 매치였는데 진짜 심했습니다. 게임 내내 욕설이 끊이질 않았어요.", ...getCommentUser("u1"), createdAt: "2026-03-09T11:00:00Z" },
  { id: "mc2", content: "이 유저 다른 매치에서도 똑같이 욕설하더라고요. 상습범입니다.", ...getCommentUser("u3"), createdAt: "2026-03-09T12:30:00Z" },
  { id: "mc3", content: "신고 영상 보니까 확실하네요. 팀원한테 저렇게 하면 안 되죠.", ...getCommentUser("u8"), createdAt: "2026-03-09T14:00:00Z" },
];

// ==================== 프로필 & 소셜 ====================

export interface Activity {
  id: string;
  type: "hack_report";
  targetNickname: string;
  targetId: string;
  /** 게시글 본문 (mockHackReports에서 자동 참조) */
  description: string;
  createdAt: string;
  hackStatus: HackStatus;
  thumbnailColor: string;
  /** 첨부 미디어 (게시글에서 자동 파생) */
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

export interface BlacklistEntry {
  id: string;
  barracksAddress: string;
  nickname: string;
  currentNickname: string;
  addedAt: string;
  nicknameChanges: number;
  status: HackStatus;
  lastCheckedAt: string;
}

export interface FollowUser {
  id: string;
  name: string;
  accuracy: number;
  kills: number;
  deaths: number;
  title: UserTitle;
  rank: MilitaryRank;
  exp: number;
  followedAt: string;
  isFollowingBack: boolean;
}

/** 현재 로그인 유저 (u1 = 서든경찰) */
export const mockMyProfile = mockUsers.find((u) => u.id === "u1")!;

// 유튜브 URL에서 썸네일 추출
function youtubeThumb(url: string | null): string | undefined {
  if (!url) return undefined;
  const m = url.match(/(?:v=|\/)([\w-]{11})/);
  return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : undefined;
}

const STATUS_THUMB_COLOR: Record<HackStatus, string> = {
  CONFIRMED: "bg-toss-red/10",
  PROBABLE: "bg-toss-orange/10",
  SUSPECT: "bg-toss-orange/10",
  DISMISSED: "bg-toss-gray-500/10",
};

/** 게시글 데이터를 기반으로 Activity 자동 생성 */
export function reportToActivity(report: HackReport, idPrefix: string): Activity {
  const thumb = youtubeThumb(report.youtubeUrl);
  return {
    id: `${idPrefix}${report.id}`,
    type: "hack_report",
    targetNickname: report.nickname,
    targetId: report.id,
    description: report.description,
    createdAt: report.createdAt,
    hackStatus: report.status,
    thumbnailColor: STATUS_THUMB_COLOR[report.status],
    mediaUrl: thumb,
    mediaType: thumb ? "video" : undefined,
  };
}

/** u1 유저(서든경찰)의 활동 — 본인이 등록한 게시글만 */
export const mockActivities: Activity[] = mockHackReports
  .filter((r) => r.reporterId === "u1")
  .map((r) => reportToActivity(r, "a"));

/** u2 유저(서든어택BJ_철구)의 활동 피드 — 실제 게시글 기반 */
export const mockUserActivities: Activity[] = mockHackReports
  .filter((r) => r.reporterId === "u2")
  .map((r) => reportToActivity(r, "ua"));

export const mockBlacklist: BlacklistEntry[] = [
  {
    id: "bl1", barracksAddress: "https://barracks.sa.nexon.com/1443173862/match", nickname: "ProGamer_99", currentNickname: "ProGamer_99",
    addedAt: "2026-03-08T14:35:00Z", nicknameChanges: 2, status: "CONFIRMED", lastCheckedAt: "2026-03-11T06:00:00Z",
  },
  {
    id: "bl2", barracksAddress: "https://barracks.sa.nexon.com/1678452390/detail", nickname: "무적전사", currentNickname: "무적전사",
    addedAt: "2026-03-05T11:25:00Z", nicknameChanges: 3, status: "CONFIRMED", lastCheckedAt: "2026-03-11T06:00:00Z",
  },
  {
    id: "bl3", barracksAddress: "https://barracks.sa.nexon.com/1587234901/detail", nickname: "그림자킬러", currentNickname: "그림자킬러",
    addedAt: "2026-03-07T09:20:00Z", nicknameChanges: 1, status: "PROBABLE", lastCheckedAt: "2026-03-11T06:00:00Z",
  },
  {
    id: "bl4", barracksAddress: "https://barracks.sa.nexon.com/1892347156/workmanship", nickname: "불꽃사수", currentNickname: "불꽃사수",
    addedAt: "2026-03-04T16:05:00Z", nicknameChanges: 1, status: "PROBABLE", lastCheckedAt: "2026-03-11T06:00:00Z",
  },
];

function makeFollowUser(id: string, followedAt: string, isFollowingBack: boolean): FollowUser {
  const u = mockUsers.find((u) => u.id === id)!;
  return {
    id: u.id, name: u.name, accuracy: u.accuracy, kills: u.kills, deaths: u.deaths,
    title: u.title, rank: u.rank, exp: u.exp, followedAt, isFollowingBack,
  };
}

export const mockFollowing: FollowUser[] = [
  makeFollowUser("u2", "2026-02-01T00:00:00Z", true),
  makeFollowUser("u3", "2026-02-15T00:00:00Z", true),
  makeFollowUser("u7", "2026-03-01T00:00:00Z", false),
  makeFollowUser("u8", "2026-01-20T00:00:00Z", true),
];

export const mockFollowers: FollowUser[] = [
  makeFollowUser("u2", "2026-02-01T00:00:00Z", true),
  makeFollowUser("u3", "2026-02-10T00:00:00Z", true),
  makeFollowUser("u4", "2026-02-20T00:00:00Z", false),
  makeFollowUser("u5", "2026-03-05T00:00:00Z", false),
  makeFollowUser("u8", "2026-01-25T00:00:00Z", true),
];

// ==================== 관리자 ====================

export interface AdminLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: "report" | "manner" | "user" | "application";
  targetId: string;
  targetName: string;
  reason: string;
  createdAt: string;
}

export const mockAdminLogs: AdminLog[] = [
  { id: "log1", actorId: "u1", actorName: "서든경찰", actorRole: "MASTER", action: "상태 변경: 의심 → 유력", targetType: "report", targetId: "2", targetName: "그림자킬러", reason: "월핵 증거 영상 확인, 투표 찬성 우세", createdAt: "2026-03-07T10:00:00Z" },
  { id: "log2", actorId: "u1", actorName: "서든경찰", actorRole: "MASTER", action: "상태 변경: 유력 → 확정", targetType: "report", targetId: "1", targetName: "ProGamer_99", reason: "다수 유저 증거 제출, 에임핵 확정", createdAt: "2026-03-08T16:00:00Z" },
  { id: "log3", actorId: "u8", actorName: "서든고인물", actorRole: "VICE_MASTER", action: "상태 변경: 의심 → 유력", targetType: "report", targetId: "5", targetName: "불꽃사수", reason: "오토에임 킬캠 영상 다수 확인", createdAt: "2026-03-05T12:00:00Z" },
  { id: "log4", actorId: "u3", actorName: "핵감별사", actorRole: "OPERATOR", action: "기각 처리", targetType: "report", targetId: "6", targetName: "초보입니다", reason: "정상 플레이 판정, 증거 불충분", createdAt: "2026-03-04T09:00:00Z" },
  { id: "log5", actorId: "u1", actorName: "서든경찰", actorRole: "MASTER", action: "크리에이터 승인", targetType: "application", targetId: "app1", targetName: "서든어택BJ_철구", reason: "서든어택 핵 잡기 콘텐츠 활발, 구독자 5만+", createdAt: "2026-03-02T14:00:00Z" },
  { id: "log6", actorId: "u1", actorName: "서든경찰", actorRole: "MASTER", action: "운영진 임명", targetType: "user", targetId: "u3", targetName: "핵감별사", reason: "성실한 활동, 높은 명중률", createdAt: "2026-02-20T10:00:00Z" },
  { id: "log7", actorId: "u8", actorName: "서든고인물", actorRole: "VICE_MASTER", action: "유저 경고", targetType: "user", targetId: "u6", targetName: "신고맨", reason: "허위 신고 반복 (3회)", createdAt: "2026-03-10T11:00:00Z" },
];

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CreatorApplication {
  id: string;
  userId: string;
  userName: string;
  channelUrl: string;
  channelType: string;
  followerCount: string;
  contentLinks: string[];
  barracksAddress?: string;
  verificationVideoUrl: string;  // 본인 인증 영상 URL (공개)
  introduction: string;
  status: ApplicationStatus;
  reviewedBy?: string;
  reviewReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export const mockApplications: CreatorApplication[] = [
  {
    id: "app1", userId: "u2", userName: "서든어택BJ_철구",
    channelUrl: "https://www.youtube.com/@suddenBJ", channelType: "유튜브",
    followerCount: "52,000", contentLinks: ["https://youtu.be/abc1", "https://youtu.be/abc2", "https://youtu.be/abc3"],
    barracksAddress: "https://barracks.sa.nexon.com/1587234901/detail",
    verificationVideoUrl: "https://youtu.be/verify_bj",
    introduction: "서든어택 핵 유저 잡기 전문 유튜버입니다. 매주 핵 유저 박제 영상을 업로드하고 있습니다.",
    status: "APPROVED", reviewedBy: "u1", reviewReason: "서든어택 핵 잡기 콘텐츠 활발, 구독자 5만+, 인증 영상 확인 완료",
    createdAt: "2026-03-01T09:00:00Z", reviewedAt: "2026-03-02T14:00:00Z",
  },
  {
    id: "app2", userId: "u4", userName: "서든워치",
    channelUrl: "https://www.twitch.tv/suddenwatch", channelType: "치지직",
    followerCount: "8,200", contentLinks: ["https://youtu.be/def1", "https://youtu.be/def2", "https://youtu.be/def3"],
    verificationVideoUrl: "https://chzzk.naver.com/video/verify_sw",
    introduction: "서든어택 비매너 유저 감시 방송을 하고 있습니다. 시청자와 함께 비매너 유저를 잡는 콘텐츠를 제작합니다.",
    status: "PENDING",
    createdAt: "2026-03-10T15:00:00Z",
  },
  {
    id: "app3", userId: "u5", userName: "정의구현",
    channelUrl: "https://www.youtube.com/@justice_sa", channelType: "유튜브",
    followerCount: "1,200", contentLinks: ["https://youtu.be/ghi1", "https://youtu.be/ghi2", "https://youtu.be/ghi3"],
    verificationVideoUrl: "https://youtu.be/verify_justice",
    introduction: "핵 유저 잡는 걸 좋아하는 유튜버입니다.",
    status: "REJECTED", reviewedBy: "u1", reviewReason: "서든어택 관련 콘텐츠 부족, 활동 이력 미흡",
    createdAt: "2026-03-05T11:00:00Z", reviewedAt: "2026-03-06T09:00:00Z",
  },
];

// ==================== 운영진 승인 요청 ====================

export type ApprovalType = "report_status" | "user_sanction";
export type ApprovalRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PendingApproval {
  id: string;
  type: ApprovalType;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  // 신고 상태 변경 요청
  reportId?: string;
  reportNickname?: string;
  requestedStatus?: HackStatus;
  reason: string;
  // 유저 제재 요청
  targetUserId?: string;
  targetUserName?: string;
  sanctionType?: string; // warn, 1d, 3d, 7d, 30d, permanent
  sanctionLabel?: string;
  // 처리 상태
  status: ApprovalRequestStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewComment?: string;
  createdAt: string;
  reviewedAt?: string;
}

export const mockPendingApprovals: PendingApproval[] = [
  {
    id: "approval1", type: "report_status",
    requesterId: "u3", requesterName: "핵감별사", requesterRole: "OPERATOR",
    reportId: "5", reportNickname: "불꽃사수", requestedStatus: "CONFIRMED",
    reason: "오토에임 킬캠 영상 5건 이상 확인, 투표 찬성 압도적. 핵 확정 요청드립니다.",
    status: "PENDING", createdAt: "2026-03-11T14:30:00Z",
  },
  {
    id: "approval2", type: "user_sanction",
    requesterId: "u3", requesterName: "핵감별사", requesterRole: "OPERATOR",
    targetUserId: "u6", targetUserName: "신고맨", sanctionType: "7d", sanctionLabel: "7일 정지",
    reason: "허위 신고 반복 4회째, 경고 이력 있음. 7일 정지 요청드립니다.",
    status: "PENDING", createdAt: "2026-03-11T16:00:00Z",
  },
  {
    id: "approval3", type: "report_status",
    requesterId: "u3", requesterName: "핵감별사", requesterRole: "OPERATOR",
    reportId: "3", reportNickname: "헤드슈터_X", requestedStatus: "CONFIRMED",
    reason: "에임핵 + 월핵 복합 사용 확인. 유튜버 증거 영상 다수.",
    status: "APPROVED", reviewerId: "u1", reviewerName: "서든경찰", reviewComment: "확인 완료, 승인합니다.",
    createdAt: "2026-03-06T08:00:00Z", reviewedAt: "2026-03-06T09:00:00Z",
  },
];

// ==================== 유틸 ====================

/** 병영주소 URL에서 숫자 ID만 추출하여 짧게 표시 */
export function formatBarracksAddress(url: string): string {
  const m = url.match(/\/(\d+)/);
  return m ? `병영주소 ${m[1]}` : url;
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
  return date.toLocaleDateString("ko-KR");
}
