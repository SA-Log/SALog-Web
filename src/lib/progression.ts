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

// ==================== 명중률 색상 ====================

export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 90) return "text-amber-400";
  if (accuracy >= 75) return "text-purple-400";
  if (accuracy >= 60) return "text-blue-400";
  if (accuracy >= 45) return "text-emerald-500";
  if (accuracy >= 30) return "text-toss-gray-500";
  return "text-red-400";
}
