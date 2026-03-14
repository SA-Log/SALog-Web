"use client";

import { useState, useEffect, useRef } from "react";

export function SaVerificationSection() {
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [saNickname, setSaNickname] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 페이지 진입 시 바로 인증 코드 발급
  useEffect(() => {
    generateCode();
  }, []);

  async function generateCode() {
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
    } catch {
      setError("서버 연결에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
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
      setSubmitted(true);
    } catch {
      setError("서버 연결에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
        <p className="text-[13px] text-toss-gray-500 animate-pulse text-center">인증 코드 발급 중...</p>
      </div>
    );
  }

  // 제출 완료
  if (submitted) {
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
            <h3 className="text-[15px] font-bold text-foreground">인증 요청 완료</h3>
            <p className="text-[12px] text-amber-500 font-medium">서든어택 닉네임: {saNickname}</p>
          </div>
        </div>
        <p className="text-[12px] text-toss-gray-500">관리자가 스크린샷을 확인한 후 인증이 완료됩니다. 보통 24시간 이내에 처리됩니다.</p>
      </div>
    );
  }

  // 코드 발급 실패
  if (!code) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5 text-center">
        <p className="text-[13px] text-toss-red mb-3">{error || "코드 생성에 실패했습니다"}</p>
        <button
          onClick={generateCode}
          className="h-10 px-5 rounded-xl bg-primary text-white text-[13px] font-semibold btn-primary"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-toss p-5">
      <div className="space-y-4">
        {/* 인증 코드 + 복사 */}
        <div className="rounded-xl p-4 bg-secondary border border-border/30 text-center">
          <p className="text-[11px] text-toss-gray-500 mb-1">인증 코드</p>
          <p className="text-[24px] font-mono font-bold text-primary tracking-wider">{code}</p>
          <button
            onClick={handleCopyCode}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                복사됨
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M9.5 4.5V3a1.5 1.5 0 00-1.5-1.5H3A1.5 1.5 0 001.5 3v5A1.5 1.5 0 003 9.5h1.5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                코드 복사
              </>
            )}
          </button>
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
    </div>
  );
}
