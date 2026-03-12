"use client";

import { useState, useEffect, useRef } from "react";

type VerificationState =
  | { status: "NONE" }
  | { status: "PENDING"; id: string; verificationCode: string; saNickname?: string; screenshotUrl?: string }
  | { status: "APPROVED"; saNickname?: string; reviewedAt?: string }
  | { status: "REJECTED"; adminNote?: string; id: string };

export function SaVerificationSection() {
  const [state, setState] = useState<VerificationState>({ status: "NONE" });
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"idle" | "code" | "upload">("idle");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [saNickname, setSaNickname] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/sa-verification/status");
      const data = await res.json();
      if (data.status === "NONE") {
        setState({ status: "NONE" });
      } else if (data.status === "PENDING") {
        setState({ status: "PENDING", id: data.id, verificationCode: data.verificationCode, saNickname: data.saNickname, screenshotUrl: data.screenshotUrl });
        if (data.screenshotUrl) {
          setStep("idle"); // 이미 제출됨
        }
      } else if (data.status === "APPROVED") {
        setState({ status: "APPROVED", saNickname: data.saNickname, reviewedAt: data.reviewedAt });
      } else if (data.status === "REJECTED") {
        setState({ status: "REJECTED", adminNote: data.adminNote, id: data.id });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateCode() {
    setError("");
    try {
      const res = await fetch("/api/sa-verification/code", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "코드 생성에 실패했습니다");
        return;
      }
      setCode(data.code);
      setVerificationId(data.id);
      setStep("code");
    } catch {
      setError("서버 연결에 실패했습니다");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("이미지 크기는 5MB 이하여야 합니다");
      return;
    }

    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!screenshot || !saNickname.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/sa-verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId,
          saNickname: saNickname.trim(),
          screenshotBase64: screenshot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "제출에 실패했습니다");
        return;
      }
      // 상태 새로고침
      await fetchStatus();
      setStep("idle");
    } catch {
      setError("서버 연결에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
        <p className="text-[13px] text-toss-gray-500 animate-pulse text-center">인증 상태 확인 중...</p>
      </div>
    );
  }

  // 이미 인증 완료
  if (state.status === "APPROVED") {
    return (
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-toss-green/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 10l3 3 5-5" stroke="#30b87e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">서든어택 인증 완료</h3>
            <p className="text-[12px] text-toss-green font-medium">{state.saNickname}</p>
          </div>
        </div>
        <p className="text-[12px] text-toss-gray-500">프로필에 인증 마크가 표시됩니다.</p>
      </div>
    );
  }

  // 심사 대기 중 (스크린샷 제출 완료)
  if (state.status === "PENDING" && state.screenshotUrl) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="#f59f00" strokeWidth="1.5"/>
              <path d="M10 7v3.5l2.5 1.5" stroke="#f59f00" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">관리자 검토 중</h3>
            <p className="text-[12px] text-amber-500 font-medium">서든어택 닉네임: {state.saNickname}</p>
          </div>
        </div>
        <p className="text-[12px] text-toss-gray-500">관리자가 스크린샷을 확인한 후 인증이 완료됩니다. 보통 24시간 이내에 처리됩니다.</p>
      </div>
    );
  }

  // 거부됨
  if (state.status === "REJECTED") {
    return (
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-toss-red/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 7l6 6M13 7l-6 6" stroke="#e03131" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">인증이 반려되었습니다</h3>
            {state.adminNote && (
              <p className="text-[12px] text-toss-red">{state.adminNote}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleGenerateCode}
          className="w-full h-10 rounded-xl bg-primary text-white text-[13px] font-semibold btn-primary mt-2"
        >
          다시 인증하기
        </button>
        {error && <p className="text-[11px] text-toss-red mt-2 text-center">{error}</p>}
      </div>
    );
  }

  // 인증 시작 전 또는 코드 발급 후
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
          </svg>
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-foreground">서든어택 계정 인증</h3>
          <p className="text-[12px] text-toss-gray-500">인증하면 프로필에 인증 마크가 표시됩니다</p>
        </div>
      </div>

      {step === "idle" && (
        <button
          onClick={handleGenerateCode}
          className="w-full h-11 rounded-xl bg-primary text-white text-[13px] font-semibold btn-primary"
        >
          인증 시작
        </button>
      )}

      {step === "code" && (
        <div className="space-y-4">
          {/* 인증 코드 */}
          <div className="rounded-xl p-4 bg-secondary border border-border/30 text-center">
            <p className="text-[11px] text-toss-gray-500 mb-1">인증 코드</p>
            <p className="text-[24px] font-mono font-bold text-primary tracking-wider">{code}</p>
          </div>

          {/* 튜토리얼 */}
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-foreground">인증 방법</p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">1</span>
                </div>
                <p className="text-[12px] text-toss-gray-700 dark:text-toss-gray-300 leading-relaxed">
                  메모장을 열고 위 <span className="font-semibold text-primary">인증 코드</span>를 크게 입력하세요
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">2</span>
                </div>
                <p className="text-[12px] text-toss-gray-700 dark:text-toss-gray-300 leading-relaxed">
                  <a href="https://barracks.sa.nexon.com" target="_blank" rel="noopener noreferrer" className="underline text-primary">병영수첩</a>에 로그인 후 오른쪽 상단 <span className="font-semibold">프로필</span>을 눌러 닉네임이 보이게 하세요
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">3</span>
                </div>
                <p className="text-[12px] text-toss-gray-700 dark:text-toss-gray-300 leading-relaxed">
                  메모장과 병영수첩 프로필이 <span className="font-semibold">동시에 보이도록</span> 스크린샷을 찍어주세요
                </p>
              </div>
            </div>
          </div>

          {/* 닉네임 입력 */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              서든어택 닉네임
            </label>
            <input
              type="text"
              value={saNickname}
              onChange={(e) => setSaNickname(e.target.value)}
              placeholder="병영수첩에 표시된 닉네임"
              maxLength={20}
              className="w-full h-11 px-4 rounded-xl bg-card border border-border text-[14px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
          </div>

          {/* 스크린샷 업로드 */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              스크린샷 업로드
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors flex flex-col items-center justify-center gap-1"
            >
              {screenshot ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 10l3 3 5-5" stroke="#30b87e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[12px] text-toss-green font-medium">{fileName}</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-toss-gray-400"/>
                  </svg>
                  <span className="text-[12px] text-toss-gray-400">이미지 선택 (최대 5MB)</span>
                </>
              )}
            </button>
          </div>

          {error && <p className="text-[11px] text-toss-red text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!screenshot || !saNickname.trim() || isSubmitting}
            className="w-full h-11 rounded-xl bg-primary text-white text-[13px] font-semibold disabled:opacity-40 btn-primary"
          >
            {isSubmitting ? "제출 중..." : "인증 요청 제출"}
          </button>
        </div>
      )}

      {error && step === "idle" && <p className="text-[11px] text-toss-red mt-2 text-center">{error}</p>}
    </div>
  );
}
