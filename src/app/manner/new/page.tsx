"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EvidenceUpload, type EvidenceItem } from "@/components/common/evidence-upload";
import { MANNER_TAG_MAP, type MannerTagType } from "@/lib/mock-data";

const TAG_OPTIONS: { value: MannerTagType; label: string; emoji: string }[] = [
  { value: "VERBAL_ABUSE", label: "욕설 / 인신공격", emoji: "🤬" },
  { value: "BLOCKING", label: "길막", emoji: "🚧" },
  { value: "GRIEFING", label: "고의 트롤링", emoji: "👺" },
  { value: "AFK", label: "잠수", emoji: "💤" },
  { value: "TEAM_KILL", label: "섬광탄 방해", emoji: "💥" },
  { value: "OTHER", label: "기타", emoji: "⚠️" },
];

type DuplicateTag = { id: string; nickname: string; tagType: MannerTagType };
type SubmitMode = "new" | "evidence" | null;

function extractNexonSn(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/barracks\.sa\.nexon\.com\/(\d+)/);
  return match ? match[1] : null;
}

export default function NewMannerTagPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [addressInput, setAddressInput] = useState("");
  const [barracksAddress, setBarracksAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [tagTypes, setTagTypes] = useState<MannerTagType[]>([]);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [lookupResult, setLookupResult] = useState<{ nickname: string; found: boolean; error?: string } | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [duplicateTag, setDuplicateTag] = useState<DuplicateTag | null>(null);
  const [submitMode, setSubmitMode] = useState<SubmitMode>(null);

  const canProceedStep1 = lookupResult?.found === true && (duplicateTag ? submitMode !== null : true);
  const canProceedStep2 = tagTypes.length > 0;

  function toggleTagType(value: MannerTagType) {
    setTagTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }
  const canSubmit = !isSubmitting;

  async function handleSubmit() {
    if (!lookupResult?.found || !lookupResult.nickname || tagTypes.length === 0) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/manner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barracksAddress,
          nickname: lookupResult.nickname,
          tagTypes,
          description: description.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSubmitError(data?.error || "등록에 실패했습니다");
        return;
      }
      router.push("/manner");
    } catch {
      setSubmitError("서버 연결에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLookup() {
    const sn = extractNexonSn(addressInput);
    if (!sn) {
      setLookupResult({ nickname: "", found: false, error: "올바른 병영주소를 입력해주세요" });
      return;
    }
    setIsLooking(true);
    setLookupResult(null);
    setDuplicateTag(null);
    setSubmitMode(null);

    try {
      const res = await fetch(`/api/barracks/profile?nexonSn=${sn}`);
      const data = await res.json();

      if (data.found) {
        setLookupResult({ nickname: data.nickname, found: true });
        setBarracksAddress(sn);
      } else {
        setLookupResult({ nickname: "", found: false, error: data.error || "해당 병영주소의 유저를 찾을 수 없습니다" });
      }
    } catch {
      setLookupResult({ nickname: "", found: false, error: "조회 중 오류가 발생했습니다" });
    } finally {
      setIsLooking(false);
    }
  }

  return (
    <div className="mx-auto max-w-screen-sm px-5 py-6">
      <Link href="/manner" className="inline-flex items-center gap-1 text-[13px] text-toss-gray-600 dark:text-toss-gray-400 hover:text-foreground transition-toss mb-5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        돌아가기
      </Link>

      <h1 className="text-[22px] font-bold text-foreground mb-1">비매너 신고 등록</h1>
      <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400 mb-4">비매너 행위에 대한 증거를 함께 제출해주세요.</p>

      {/* Progress - always 3 steps */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className={`flex items-center ${i < 2 ? "flex-1" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-toss ${
              step >= s ? "bg-primary text-white" : "bg-toss-gray-100 dark:bg-toss-gray-700 text-toss-gray-400"
            }`}>
              {step > s ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : s}
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 mx-2 rounded-full transition-toss ${step > s ? "bg-primary" : "bg-toss-gray-100 dark:bg-toss-gray-700"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Target */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              병영주소 <span className="text-toss-red">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => { setAddressInput(e.target.value); setLookupResult(null); setDuplicateTag(null); setSubmitMode(null); setBarracksAddress(""); }}
                placeholder="https://barracks.sa.nexon.com/1234567890/match"
                className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
              <button onClick={handleLookup} disabled={!addressInput.trim() || isLooking}
                className="h-11 px-5 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-40 btn-primary shrink-0">
                {isLooking ? "조회 중..." : "조회"}
              </button>
            </div>
            <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 mt-1.5">
              신고 대상의 병영수첩 URL을 입력해주세요
            </p>
          </div>

          {lookupResult && (
            <div className={`rounded-xl p-4 border ${lookupResult.found ? "bg-toss-green-light dark:bg-toss-green/10 border-toss-green/20" : "bg-toss-red-light dark:bg-toss-red/10 border-toss-red/20"}`}>
              {lookupResult.found ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-toss-gray-700 flex items-center justify-center">
                    <span className="text-[14px] font-bold text-toss-gray-600 dark:text-toss-gray-300">{lookupResult.nickname.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{lookupResult.nickname}</p>
                    <a href={barracksAddress.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-primary hover:opacity-80 transition-opacity">
                      병영수첩 바로가기
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 7L7 3M7 3H4M7 3V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                  </div>
                  <div className="ml-auto">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill="#30b87e" fillOpacity="0.15"/>
                      <path d="M6 10L9 13L14 7" stroke="#30b87e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-toss-red">{lookupResult.error}</p>
              )}
            </div>
          )}

          {/* Duplicate detected */}
          {duplicateTag && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-[16px] shrink-0">⚠️</span>
                <div>
                  <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-400">이미 등록된 병영주소입니다</p>
                  <p className="text-[12px] text-amber-700 dark:text-amber-400/80 mt-0.5">
                    <a href={`/manner/${duplicateTag.id}`} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline font-medium">{lookupResult?.nickname || duplicateTag.nickname}</a> 유저가 이미 신고되어 있습니다.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setSubmitMode("evidence")}
                  className={`w-full p-3 rounded-xl border text-left transition-colors ${
                    submitMode === "evidence"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-toss-gray-300 dark:hover:border-toss-gray-600"
                  }`}
                >
                  <p className={`text-[13px] font-semibold ${submitMode === "evidence" ? "text-primary" : "text-foreground"}`}>추가 증거 제출</p>
                  <p className="text-[11px] text-toss-gray-500 mt-0.5">기존 신고 건에 유형, 설명, 증거를 추가합니다</p>
                </button>
                <button
                  onClick={() => setSubmitMode("new")}
                  className={`w-full p-3 rounded-xl border text-left transition-colors ${
                    submitMode === "new"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-toss-gray-300 dark:hover:border-toss-gray-600"
                  }`}
                >
                  <p className={`text-[13px] font-semibold ${submitMode === "new" ? "text-primary" : "text-foreground"}`}>새 신고 등록</p>
                  <p className="text-[11px] text-toss-gray-500 mt-0.5">별도 신고 건으로 등록하고 기존 건과 연결합니다</p>
                </button>
              </div>
            </div>
          )}

          <button onClick={() => setStep(2)} disabled={!canProceedStep1}
            className="w-full h-12 rounded-xl bg-primary text-white text-[14px] font-semibold disabled:opacity-40 btn-primary">
            다음
          </button>
        </div>
      )}

      {/* Step 2: Tag type & description (both modes) */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-secondary rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-toss-gray-200 dark:bg-toss-gray-700 flex items-center justify-center">
              <span className="text-[14px] font-bold text-toss-gray-600 dark:text-toss-gray-300">{lookupResult?.nickname?.charAt(0)}</span>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">{lookupResult?.nickname}</p>
              <a href={barracksAddress.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-primary hover:opacity-80 transition-opacity">
                병영수첩 바로가기
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 7L7 3M7 3H4M7 3V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
            {duplicateTag && (
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold">
                {submitMode === "evidence" ? "추가 증거" : "기존 건 연결"}
              </span>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-1">비매너 유형 <span className="font-normal text-toss-gray-500">(복수 선택 가능)</span></label>
            <div className="grid grid-cols-2 gap-2">
              {TAG_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => toggleTagType(opt.value)}
                  className={`p-3 rounded-xl border text-left btn-chip ${
                    tagTypes.includes(opt.value)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      tagTypes.includes(opt.value) ? "border-primary bg-primary" : "border-toss-gray-300 dark:border-toss-gray-600"
                    }`}>
                      {tagTypes.includes(opt.value) && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </div>
                    <span className="text-[14px]">{opt.emoji}</span>
                  </div>
                  <p className={`text-[12px] font-medium mt-1 ${tagTypes.includes(opt.value) ? "text-primary" : "text-toss-gray-700 dark:text-toss-gray-300"}`}>
                    {opt.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              상세 설명 <span className="font-normal text-toss-gray-500 dark:text-toss-gray-400">({description.length}/300)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              placeholder="어떤 비매너 행위가 있었는지 구체적으로 작성해주세요&#10;(예: 랭크전에서 2라운드부터 의도적으로 길막 반복)"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-toss-gray-500 mt-1.5 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 5.5V8M6 3.5V4M11 6C11 8.76 8.76 11 6 11C3.24 11 1 8.76 1 6C1 3.24 3.24 1 6 1C8.76 1 11 3.24 11 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              사유가 구체적일수록 신뢰도가 높아집니다
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)}
              className="flex-1 h-12 rounded-xl bg-secondary text-toss-gray-700 dark:text-toss-gray-300 text-[14px] font-semibold btn-secondary">
              이전
            </button>
            <button onClick={() => setStep(3)} disabled={!canProceedStep2}
              className="flex-1 h-12 rounded-xl bg-primary text-white text-[14px] font-semibold disabled:opacity-40 btn-primary">
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Evidence */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-secondary rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-toss-gray-200 dark:bg-toss-gray-700 flex items-center justify-center">
                <span className="text-[14px] font-bold text-toss-gray-600 dark:text-toss-gray-300">{lookupResult?.nickname?.charAt(0)}</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-foreground">{lookupResult?.nickname}</p>
                <a href={barracksAddress.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-primary hover:opacity-80 transition-opacity">
                  병영수첩 바로가기
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 7L7 3M7 3H4M7 3V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px] flex-wrap">
              {tagTypes.map((tt) => {
                const mapInfo = MANNER_TAG_MAP[tt];
                return (
                  <span key={tt} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${mapInfo.bg} ${mapInfo.color}`}>
                    {mapInfo.emoji} {mapInfo.label}
                  </span>
                );
              })}
              {duplicateTag && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold">
                  {submitMode === "evidence" ? "추가 증거" : "기존 건 연결"}
                </span>
              )}
            </div>
          </div>

          {submitMode === "evidence" && duplicateTag && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] text-toss-gray-500 mb-2">연결될 기존 신고</p>
              <a href={`/manner/${duplicateTag.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                <span className="text-[13px] font-semibold">{lookupResult?.nickname || duplicateTag.nickname} 신고 건 보기</span>
              </a>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              증거 자료 <span className="text-[11px] font-normal text-toss-gray-500">(선택)</span>
            </label>
            <EvidenceUpload items={evidence} onChange={setEvidence} />
          </div>

          {submitError && (
            <p className="text-[12px] text-toss-red text-center">{submitError}</p>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep(2)}
              className="flex-1 h-12 rounded-xl bg-secondary text-toss-gray-700 dark:text-toss-gray-300 text-[14px] font-semibold btn-secondary">
              이전
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 h-12 rounded-xl bg-toss-orange text-white text-[14px] font-semibold disabled:opacity-40 btn-orange">
              {isSubmitting ? "등록 중..." : submitMode === "evidence" ? "증거 제출" : "등록하기"}
            </button>
          </div>

          <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 text-center leading-relaxed">
            악의적인 허위 등록 시 서비스 이용이 제한될 수 있습니다.
          </p>
        </div>
      )}

      {/* EXP info */}
      <div className="mt-8 rounded-xl border border-border bg-card p-4 space-y-2.5">
        <p className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L8.8 4.6L12.8 5.2L9.9 8L10.6 12L7 10.1L3.4 12L4.1 8L1.2 5.2L5.2 4.6L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"/></svg>
          경험치 안내
        </p>
        <div className="space-y-1">
          <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
            · 신고 등록만으로는 경험치가 지급되지 않습니다
          </p>
          <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
            · 커뮤니티 투표에서 동의가 우세할 때 경험치가 지급됩니다
          </p>
          <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
            · 비매너 신고는 등록 횟수 제한이 없습니다
          </p>
        </div>
      </div>

      <div className="mt-3 p-4 rounded-xl bg-secondary border border-border">
        <p className="text-[11px] text-toss-gray-700 dark:text-toss-gray-400 leading-relaxed text-center">
          비매너 신고는 참고 정보이며, 공식적인 제재와 무관합니다.
        </p>
      </div>
    </div>
  );
}
