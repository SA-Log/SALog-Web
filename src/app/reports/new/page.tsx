"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EvidenceUpload, type EvidenceItem } from "@/components/common/evidence-upload";

const DAILY_REPORT_LIMIT = 5;

const HACK_TYPES = [
  { value: "aimbot", label: "에임핵 (오토에임)" },
  { value: "wallhack", label: "월핵 (투시)" },
  { value: "speedhack", label: "스피드핵" },
  { value: "norecoil", label: "무반동" },
  { value: "other", label: "기타" },
];

type DuplicateReport = { id: string; nickname: string; status: string };
type SubmitMode = "new" | "evidence" | null;

function extractNexonSn(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/barracks\.sa\.nexon\.com\/(\d+)/);
  return match ? match[1] : null;
}

export default function NewReportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [addressInput, setAddressInput] = useState("");
  const [barracksAddress, setBarracksAddress] = useState("");
  const [hackTypes, setHackTypes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [lookupResult, setLookupResult] = useState<{ nickname: string; found: boolean; error?: string } | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [duplicateReport, setDuplicateReport] = useState<DuplicateReport | null>(null);
  const [submitMode, setSubmitMode] = useState<SubmitMode>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [todayCount, setTodayCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.todayCount === "number") setTodayCount(data.todayCount);
      })
      .catch(() => {})
      .finally(() => setIsLoadingCount(false));
  }, []);

  const remaining = DAILY_REPORT_LIMIT - todayCount;
  const isLimitReached = remaining <= 0;

  const canProceedStep1 = !isLimitReached && lookupResult?.found === true && (duplicateReport ? submitMode !== null : true);
  const canProceedStep2 = hackTypes.length > 0;
  const canSubmit = !isSubmitting;

  function toggleHackType(value: string) {
    setHackTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleLookup() {
    const sn = extractNexonSn(addressInput);
    if (!sn) {
      setLookupResult({ nickname: "", found: false, error: "올바른 병영주소를 입력해주세요" });
      return;
    }
    setIsLooking(true);
    setLookupResult(null);
    setDuplicateReport(null);
    setSubmitMode(null);

    try {
      const res = await fetch(`/api/barracks/profile?nexonSn=${sn}`);
      const data = await res.json();

      if (data.found) {
        setLookupResult({ nickname: data.nickname, found: true });
        setBarracksAddress(sn);

        // 병영주소로 중복 신고 확인 (DB 조회)
        try {
          const dupRes = await fetch("/api/reports/check-duplicate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nickname: data.nickname, barracksAddress: sn }),
          });
          const dupData = await dupRes.json();
          if (dupData.duplicate && dupData.report) {
            setDuplicateReport({
              id: dupData.report.id,
              nickname: dupData.report.nickname,
              status: dupData.report.status,
            });
          }
        } catch {
          // 중복 확인 실패해도 신고 진행 가능
        }
      } else {
        setLookupResult({ nickname: "", found: false, error: data.error || "해당 병영주소의 유저를 찾을 수 없습니다" });
      }
    } catch {
      setLookupResult({ nickname: "", found: false, error: "조회 중 오류가 발생했습니다" });
    } finally {
      setIsLooking(false);
    }
  }

  async function handleSubmit() {
    if (!lookupResult?.found || !lookupResult.nickname) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // 파일 증거 업로드
      const uploadedEvidences: { type: string; url: string; name: string }[] = [];

      for (const item of evidence) {
        if (item.type === "youtube" || item.type === "link") {
          uploadedEvidences.push({ type: item.type, url: item.url!, name: item.name });
        } else if (item.file) {
          const formData = new FormData();
          formData.append("file", item.file);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) {
            setSubmitError(uploadData.error || "파일 업로드에 실패했습니다");
            return;
          }
          uploadedEvidences.push({ type: uploadData.type, url: uploadData.url, name: uploadData.name });
        }
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barracksAddress: barracksAddress.trim(),
          nickname: lookupResult.nickname,
          hackTypes,
          description: description.trim(),
          evidences: uploadedEvidences.length > 0 ? uploadedEvidences : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "신고 등록에 실패했습니다");
        return;
      }

      router.push(`/reports/${data.id}`);
    } catch {
      setSubmitError("서버 연결에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-screen-sm px-5 py-6">
      {/* Back */}
      <Link href="/reports" className="inline-flex items-center gap-1 text-[13px] text-toss-gray-600 dark:text-toss-gray-400 hover:text-foreground transition-toss mb-5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        돌아가기
      </Link>

      <h1 className="text-[22px] font-bold text-foreground mb-1">핵 유저 신고</h1>
      <p className="text-[13px] text-toss-gray-600 dark:text-toss-gray-400 mb-4">증거 기반으로 신고해주세요. 허위 신고 시 명중률이 하락합니다.</p>

      {/* Daily limit */}
      <div className={`rounded-xl p-3.5 mb-6 flex items-center justify-between ${
        isLimitReached
          ? "bg-toss-red-light dark:bg-toss-red/10 border border-toss-red/20"
          : "bg-secondary border border-border/50"
      }`}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" className={isLimitReached ? "text-toss-red" : "text-toss-gray-400"}/>
            <path d="M7 4V7.5L9.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className={isLimitReached ? "text-toss-red" : "text-toss-gray-400"}/>
          </svg>
          <span className={`text-[12px] font-medium ${isLimitReached ? "text-toss-red" : "text-toss-gray-600 dark:text-toss-gray-400"}`}>
            {isLoadingCount ? "확인 중..." : isLimitReached ? "오늘 신고 등록 한도에 도달했습니다" : "오늘 신고 등록"}
          </span>
        </div>
        <span className={`text-[13px] font-bold ${isLimitReached ? "text-toss-red" : "text-foreground"}`}>
          {isLoadingCount ? "-" : `${todayCount}/${DAILY_REPORT_LIMIT}`}
        </span>
      </div>

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
                onChange={(e) => { setAddressInput(e.target.value); setLookupResult(null); setDuplicateReport(null); setSubmitMode(null); setBarracksAddress(""); }}
                placeholder="https://barracks.sa.nexon.com/1234567890/match"
                className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
              <button
                onClick={handleLookup}
                disabled={!addressInput.trim() || isLooking}
                className="h-11 px-5 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-40 btn-primary shrink-0"
              >
                {isLooking ? "조회 중..." : "조회"}
              </button>
            </div>
            <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 mt-1.5">
              신고 대상의 병영수첩 URL을 입력해주세요
            </p>
          </div>

          {/* Lookup result */}
          {lookupResult && (
            <div className={`rounded-xl p-4 border ${
              lookupResult.found
                ? "bg-toss-green-light dark:bg-toss-green/10 border-toss-green/20"
                : "bg-toss-red-light dark:bg-toss-red/10 border-toss-red/20"
            }`}>
              {lookupResult.found ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-toss-gray-700 flex items-center justify-center">
                    <span className="text-[14px] font-bold text-toss-gray-600 dark:text-toss-gray-300">{lookupResult.nickname.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{lookupResult.nickname}</p>
                    <p className="text-[12px] text-toss-green">유저 확인 완료</p>
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
          {duplicateReport && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-[16px] shrink-0">⚠️</span>
                <div>
                  <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-400">이미 등록된 병영주소입니다</p>
                  <p className="text-[12px] text-amber-700 dark:text-amber-400/80 mt-0.5">
                    <a href={`/reports/${duplicateReport.id}`} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline font-medium">{lookupResult?.nickname || duplicateReport.nickname}</a> 유저가 이미 신고되어 있습니다.
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
                  <p className="text-[11px] text-toss-gray-500 mt-0.5">기존 신고 건에 핵 유형, 설명, 증거를 추가합니다</p>
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

          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="w-full h-12 rounded-xl bg-primary text-white text-[14px] font-semibold disabled:opacity-40 btn-primary"
          >
            다음
          </button>
        </div>
      )}

      {/* Step 2: Hack type & description (both modes) */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Target summary */}
          <div className="bg-secondary rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-toss-gray-200 dark:bg-toss-gray-700 flex items-center justify-center">
              <span className="text-[14px] font-bold text-toss-gray-600 dark:text-toss-gray-300">{lookupResult?.nickname?.charAt(0)}</span>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">{lookupResult?.nickname}</p>
              {barracksAddress && (
                <a href={`https://barracks.sa.nexon.com/${barracksAddress}/match`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-primary hover:opacity-80 transition-opacity">
                  병영수첩 바로가기
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 7L7 3M7 3H4M7 3V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              )}
            </div>
            {duplicateReport && (
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold">
                {submitMode === "evidence" ? "추가 증거" : "기존 건 연결"}
              </span>
            )}
          </div>

          {/* Hack type - multi-select */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-1">핵 유형 <span className="font-normal text-toss-gray-500">(복수 선택 가능)</span></label>
            <div className="grid grid-cols-2 gap-2">
              {HACK_TYPES.map((ht) => (
                <button
                  key={ht.value}
                  onClick={() => toggleHackType(ht.value)}
                  className={`p-3 rounded-xl border text-[12px] font-medium text-left btn-chip ${
                    hackTypes.includes(ht.value)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-toss-gray-700 dark:text-toss-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      hackTypes.includes(ht.value) ? "border-primary bg-primary" : "border-toss-gray-300 dark:border-toss-gray-600"
                    }`}>
                      {hackTypes.includes(ht.value) && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </div>
                    {ht.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              상세 설명 <span className="font-normal text-toss-gray-500 dark:text-toss-gray-400">({description.length}/500)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="어떤 상황에서 핵 사용이 의심되었는지 구체적으로 작성해주세요&#10;(예: 킬캠에서 벽 뒤의 적을 정확히 조준, 비정상적인 에임 스냅 등)"
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none leading-relaxed"
            />
            <p className="text-[11px] text-toss-gray-500 mt-1.5 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 5.5V8M6 3.5V4M11 6C11 8.76 8.76 11 6 11C3.24 11 1 8.76 1 6C1 3.24 3.24 1 6 1C8.76 1 11 3.24 11 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              사유가 구체적일수록 기각될 확률이 낮아집니다
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
          {/* Summary */}
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
              {hackTypes.map((ht) => (
                <span key={ht} className="px-2 py-0.5 rounded-md bg-toss-red-light dark:bg-toss-red/15 text-toss-red font-semibold">
                  {HACK_TYPES.find((h) => h.value === ht)?.label}
                </span>
              ))}
              {duplicateReport && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold">
                  {submitMode === "evidence" ? "추가 증거" : "기존 건 연결"}
                </span>
              )}
            </div>
          </div>

          {/* Linked report info for evidence mode */}
          {submitMode === "evidence" && duplicateReport && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] text-toss-gray-500 mb-2">연결될 기존 신고</p>
              <a href={`/reports/${duplicateReport.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5L8.5 5.5M6 5H5a2 2 0 0 0 0 4h1M8 5h1a2 2 0 0 1 0 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                <span className="text-[13px] font-semibold">{lookupResult?.nickname || duplicateReport.nickname} 신고 건 보기</span>
              </a>
            </div>
          )}

          {/* Evidence */}
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
              className="flex-1 h-12 rounded-xl bg-toss-red text-white text-[14px] font-semibold disabled:opacity-40 btn-danger"
            >
              {isSubmitting ? "제출 중..." : submitMode === "evidence" ? "증거 제출" : "신고 제출"}
            </button>
          </div>

          <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 text-center leading-relaxed">
            허위 신고 시 명중률이 하락하며, 반복 시 기능이 제한됩니다.
            제출된 증거는 커뮤니티 검증에 활용됩니다.
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
            · 핵 확정 시 최초 신고자 20 EXP, 추가 증거 제출자 15 EXP
          </p>
          <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
            · 핵 유력 시 최초 신고자 8 EXP, 추가 증거 제출자 5 EXP
          </p>
          <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-400 leading-relaxed">
            · 기각 시 신고자 명중률 하락 (deaths +1)
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-3 p-4 rounded-xl bg-secondary border border-border">
        <p className="text-[11px] text-toss-gray-700 dark:text-toss-gray-400 leading-relaxed text-center">
          SALog는 커뮤니티 기반 정보 공유 플랫폼이며, 신고 내용에 대한 책임은 신고자 본인에게 있습니다.
        </p>
      </div>
    </div>
  );
}
