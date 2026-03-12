"use client";

import { useState } from "react";

export interface EvidenceItem {
  id: string;
  type: "video" | "screenshot" | "youtube" | "link";
  file?: File;
  url?: string;
  preview?: string;
  name: string;
}

const EVIDENCE_TYPES = [
  { type: "screenshot" as const, label: "스크린샷", icon: "📸", accept: "image/*", desc: "킬캠, 전적, 병영수첩 캡처" },
  { type: "video" as const, label: "영상", icon: "🎬", accept: "video/*", desc: "직접 녹화한 영상 파일" },
  { type: "youtube" as const, label: "YouTube 링크", icon: "▶️", accept: null, desc: "유튜브 영상 URL" },
  { type: "link" as const, label: "기타 링크", icon: "🔗", accept: null, desc: "기타 증거 URL" },
];

export function EvidenceUpload({
  items,
  onChange,
}: {
  items: EvidenceItem[];
  onChange: (items: EvidenceItem[]) => void;
}) {
  const [urlInput, setUrlInput] = useState("");
  const [activeAdd, setActiveAdd] = useState<"youtube" | "link" | null>(null);

  function addFile(type: "video" | "screenshot", files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const newItem: EvidenceItem = {
      id: crypto.randomUUID(),
      type,
      file,
      name: file.name,
      preview: type === "screenshot" ? URL.createObjectURL(file) : undefined,
    };
    onChange([...items, newItem]);
    setActiveAdd(null);
  }

  function addUrl() {
    const url = urlInput.trim();
    if (!url) return;

    if (activeAdd === "youtube") {
      if (!url.match(/youtube\.com|youtu\.be/)) return;
      const newItem: EvidenceItem = {
        id: crypto.randomUUID(),
        type: "youtube",
        url,
        name: extractYoutubeId(url) || url,
      };
      onChange([...items, newItem]);
    } else {
      const newItem: EvidenceItem = {
        id: crypto.randomUUID(),
        type: "link",
        url,
        name: extractDomain(url) || url,
      };
      onChange([...items, newItem]);
    }

    setUrlInput("");
    setActiveAdd(null);
  }

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  const iconMap: Record<EvidenceItem["type"], string> = {
    screenshot: "📸",
    video: "🎬",
    youtube: "▶️",
    link: "🔗",
  };

  const labelMap: Record<EvidenceItem["type"], string> = {
    screenshot: "스크린샷",
    video: "영상",
    youtube: "YouTube 링크",
    link: "기타 링크",
  };

  return (
    <div>
      {/* Added items */}
      {items.length > 0 && (
        <div className="space-y-2 mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-secondary rounded-xl p-3 border border-border/50">
              {/* Preview or icon */}
              {item.type === "screenshot" && item.preview ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-toss-gray-200 dark:bg-toss-gray-700 shrink-0">
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-toss-gray-200 dark:bg-toss-gray-700 flex items-center justify-center shrink-0">
                  <span className="text-[20px]">{iconMap[item.type]}</span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-foreground truncate">{item.name}</p>
                <p className="text-[11px] text-toss-gray-500 dark:text-toss-gray-400">
                  {labelMap[item.type]}
                  {item.file && ` · ${(item.file.size / 1024 / 1024).toFixed(1)}MB`}
                </p>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="shrink-0 w-7 h-7 rounded-full bg-toss-gray-200 dark:bg-toss-gray-700 flex items-center justify-center btn-ghost"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2L8 8M2 8L8 2" stroke="#6b7684" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      {!activeAdd && (
        <div className="grid grid-cols-2 gap-2">
          {EVIDENCE_TYPES.map((et) => (
            <button
              key={et.type}
              onClick={() => {
                if (et.accept) {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = et.accept;
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    addFile(et.type as "video" | "screenshot", target.files);
                  };
                  input.click();
                } else {
                  setActiveAdd(et.type as "youtube" | "link");
                }
              }}
              className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-border bg-card btn-chip text-left"
            >
              <span className="text-[18px]">{et.icon}</span>
              <div>
                <p className="text-[12px] font-medium text-foreground">{et.label}</p>
                <p className="text-[10px] text-toss-gray-500 dark:text-toss-gray-400">{et.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* URL input (YouTube or generic link) */}
      {activeAdd && (
        <div className="bg-secondary rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[16px]">{activeAdd === "youtube" ? "▶️" : "🔗"}</span>
            <span className="text-[13px] font-semibold text-foreground">
              {activeAdd === "youtube" ? "YouTube 링크 추가" : "기타 링크 추가"}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={activeAdd === "youtube" ? "https://youtube.com/watch?v=..." : "https://..."}
              className="flex-1 h-10 px-3 rounded-xl bg-card border border-border text-[13px] placeholder:text-toss-gray-400 outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <button
              onClick={addUrl}
              disabled={!urlInput.trim()}
              className="h-10 px-4 rounded-xl bg-primary text-white text-[12px] font-semibold disabled:opacity-40 btn-primary shrink-0"
            >
              추가
            </button>
          </div>
          {activeAdd === "youtube" && urlInput && !urlInput.match(/youtube\.com|youtu\.be/) && (
            <p className="text-[11px] text-toss-red mt-1.5">유효한 YouTube URL을 입력해주세요</p>
          )}
          <button
            onClick={() => { setActiveAdd(null); setUrlInput(""); }}
            className="text-[12px] text-toss-gray-500 dark:text-toss-gray-400 mt-2 btn-ghost"
          >
            취소
          </button>
        </div>
      )}

      {/* Requirement notice */}
      <p className="text-[11px] text-toss-gray-500 dark:text-toss-gray-400 mt-3">
        증거는 최소 1개 이상 첨부해야 합니다. 영상/스크린샷은 최대 50MB까지 업로드 가능합니다.
      </p>
    </div>
  );
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `youtube:${match[1]}` : null;
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return url;
  }
}
