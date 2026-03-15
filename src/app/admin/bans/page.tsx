"use client";

import { useState, useEffect } from "react";
import { useAdminRole } from "../layout";

type Ban = {
  id: string;
  userId: string | null;
  barracksAddress: string | null;
  reason: string;
  type: "WARNING" | "TEMP" | "PERMANENT";
  expiresAt: string | null;
  bannedBy: string;
  createdAt: string;
  user: { nickname: string | null; barracksAddress: string | null } | null;
};

const BAN_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  WARNING: { label: "경고", color: "text-amber-600", bg: "bg-amber-500/10" },
  TEMP: { label: "임시 정지", color: "text-toss-red", bg: "bg-toss-red/10" },
  PERMANENT: { label: "영구 정지", color: "text-toss-red", bg: "bg-toss-red/10" },
};

export default function BansPage() {
  const { role } = useAdminRole();
  const canBan = role === "MASTER" || role === "VICE_MASTER";
  const needsApproval = role === "OPERATOR";

  const [bans, setBans] = useState<Ban[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // 밴 폼 상태
  const [targetNickname, setTargetNickname] = useState("");
  const [targetBarracks, setTargetBarracks] = useState("");
  const [reason, setReason] = useState("");
  const [banType, setBanType] = useState<"WARNING" | "TEMP" | "PERMANENT">("WARNING");
  const [duration, setDuration] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // 유저 검색 결과
  const [searchResult, setSearchResult] = useState<{ id: string; nickname: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    fetchBans();
  }, []);

  async function fetchBans() {
    try {
      const res = await fetch("/api/admin/ban");
      const data = await res.json();
      if (data.bans) setBans(data.bans);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleSearchUser() {
    if (!targetNickname.trim()) return;
    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const res = await fetch(`/api/admin/ban/search?nickname=${encodeURIComponent(targetNickname.trim())}`);
      const data = await res.json();
      if (data.user) {
        setSearchResult(data.user);
      } else {
        setSearchError("유저를 찾을 수 없습니다");
      }
    } catch {
      setSearchError("검색에 실패했습니다");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSubmitBan() {
    if (!reason.trim()) {
      setFormError("사유를 입력해주세요");
      return;
    }
    if (!searchResult && !targetBarracks.trim()) {
      setFormError("유저 또는 병영주소를 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    const expiresAt = banType === "TEMP"
      ? new Date(Date.now() + Number(duration) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: searchResult?.id || undefined,
          barracksAddress: targetBarracks.trim() || undefined,
          reason: reason.trim(),
          type: banType,
          expiresAt,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setFormError(data?.error || "제재에 실패했습니다");
        return;
      }
      setFormSuccess("제재가 적용되었습니다");
      setTargetNickname("");
      setTargetBarracks("");
      setReason("");
      setBanType("WARNING");
      setSearchResult(null);
      fetchBans();
    } catch {
      setFormError("서버 연결에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
  }

  function isActive(ban: Ban) {
    if (ban.type === "WARNING") return false;
    if (ban.type === "PERMANENT") return true;
    if (ban.expiresAt && new Date(ban.expiresAt) > new Date()) return true;
    return false;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-foreground">유저 제재</h1>
          <p className="text-[12px] text-toss-gray-500 mt-0.5">경고, 임시 정지, 영구 정지를 관리합니다</p>
        </div>
        {(canBan || needsApproval) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="h-9 px-4 rounded-xl bg-toss-red text-white text-[13px] font-semibold hover:bg-toss-red/90 transition-all active:scale-[0.97]"
          >
            {showForm ? "취소" : "+ 새 제재"}
          </button>
        )}
      </div>

      {/* 제재 폼 */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5 space-y-4">
          <h2 className="text-[15px] font-bold text-foreground">제재 부여</h2>

          {needsApproval && (
            <div className="rounded-xl p-3 bg-amber-500/5 border border-amber-500/10">
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                운영진의 제재는 마스터 또는 부마스터의 승인이 필요합니다.
              </p>
            </div>
          )}

          {/* 유저 검색 */}
          <div>
            <label className="block text-[12px] font-semibold text-toss-gray-500 mb-2">유저 검색</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetNickname}
                onChange={(e) => { setTargetNickname(e.target.value); setSearchResult(null); setSearchError(""); }}
                placeholder="닉네임 입력"
                className="flex-1 h-10 px-3 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleSearchUser}
                disabled={!targetNickname.trim() || isSearching}
                className="h-10 px-4 rounded-xl bg-secondary text-[12px] font-semibold disabled:opacity-40"
              >
                {isSearching ? "검색 중..." : "검색"}
              </button>
            </div>
            {searchResult && (
              <div className="mt-2 p-2.5 rounded-lg bg-toss-green/5 border border-toss-green/20 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="#30b87e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-[12px] font-medium text-foreground">{searchResult.nickname}</span>
              </div>
            )}
            {searchError && <p className="text-[11px] text-toss-red mt-1.5">{searchError}</p>}
          </div>

          {/* 병영주소 (선택) */}
          <div>
            <label className="block text-[12px] font-semibold text-toss-gray-500 mb-2">
              병영주소 <span className="text-[10px] font-normal">(선택 — 병영주소 밴 시)</span>
            </label>
            <input
              type="text"
              value={targetBarracks}
              onChange={(e) => setTargetBarracks(e.target.value)}
              placeholder="nexonSn (숫자)"
              className="w-full h-10 px-3 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* 제재 종류 */}
          <div>
            <label className="block text-[12px] font-semibold text-toss-gray-500 mb-2">제재 종류</label>
            <div className="flex gap-2">
              {(["WARNING", "TEMP", "PERMANENT"] as const).map((type) => {
                const info = BAN_TYPE_LABELS[type];
                return (
                  <button
                    key={type}
                    onClick={() => setBanType(type)}
                    className={`flex-1 h-10 rounded-xl text-[12px] font-semibold transition-all ${
                      banType === type
                        ? `${info.bg} ${info.color} ring-1 ring-current`
                        : "bg-secondary text-toss-gray-500"
                    }`}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 기간 (임시 정지만) */}
          {banType === "TEMP" && (
            <div>
              <label className="block text-[12px] font-semibold text-toss-gray-500 mb-2">정지 기간</label>
              <div className="flex gap-2">
                {[
                  { value: "7", label: "7일" },
                  { value: "30", label: "30일" },
                  { value: "90", label: "90일" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDuration(opt.value)}
                    className={`flex-1 h-10 rounded-xl text-[12px] font-semibold transition-all ${
                      duration === opt.value
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "bg-secondary text-toss-gray-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 사유 */}
          <div>
            <label className="block text-[12px] font-semibold text-toss-gray-500 mb-2">사유</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="제재 사유를 입력하세요"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {formError && <p className="text-[12px] text-toss-red text-center">{formError}</p>}
          {formSuccess && <p className="text-[12px] text-toss-green text-center">{formSuccess}</p>}

          <button
            onClick={handleSubmitBan}
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-toss-red text-white text-[13px] font-semibold disabled:opacity-40 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? "처리 중..." : needsApproval ? "승인 요청" : "제재 적용"}
          </button>
        </div>
      )}

      {/* 제재 목록 */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss overflow-hidden">
        <div className="px-5 py-3 border-b border-border/30">
          <p className="text-[13px] font-semibold text-foreground">제재 이력</p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-[13px] text-toss-gray-500 animate-pulse">로딩 중...</p>
          </div>
        ) : bans.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[13px] text-toss-gray-500">제재 이력이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {bans.map((ban) => {
              const typeInfo = BAN_TYPE_LABELS[ban.type];
              const active = isActive(ban);
              return (
                <div key={ban.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      {active && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-toss-red/10 text-toss-red">활성</span>
                      )}
                      <span className="text-[13px] font-semibold text-foreground">
                        {ban.user?.nickname ?? ban.barracksAddress ?? "알 수 없음"}
                      </span>
                    </div>
                    <span className="text-[11px] text-toss-gray-400">{formatDate(ban.createdAt)}</span>
                  </div>
                  <p className="text-[12px] text-toss-gray-500">{ban.reason}</p>
                  {ban.type === "TEMP" && ban.expiresAt && (
                    <p className="text-[11px] text-toss-gray-400 mt-1">
                      만료: {formatDate(ban.expiresAt)}
                    </p>
                  )}
                  {ban.barracksAddress && (
                    <p className="text-[11px] text-toss-gray-400 mt-0.5">
                      병영주소: {ban.barracksAddress}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
