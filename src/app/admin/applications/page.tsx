"use client";

export default function AdminApplicationsPage() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-[16px] font-bold text-foreground">크리에이터 심사</p>
      <p className="text-[13px] text-toss-gray-500 mt-1">준비 중입니다</p>
    </div>
  );
}
