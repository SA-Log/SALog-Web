import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const [hackReports, mannerReports, nicknameChanges, users] = await Promise.all([
    prisma.hackReport.count(),
    prisma.mannerTag.count(),
    prisma.nicknameHistory.count(),
    prisma.user.count({ where: { deletedAt: null } }),
  ]);
  return { hackReports, mannerReports, nicknameChanges, users };
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="mx-auto max-w-screen-lg px-5">
      {/* Hero */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
        <div className="live-indicator inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-toss-red/10 text-toss-red text-[12px] font-semibold mb-6">
          <span className="relative w-2 h-2 rounded-full bg-toss-red" />
          실시간 닉네임 변경 추적 중
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-foreground leading-tight">
          서든어택 핵 유저,<br />
          <span className="text-primary">더 이상 숨지 못합니다</span>
        </h1>
        <p className="mt-4 text-[14px] sm:text-[15px] text-toss-gray-600 leading-relaxed max-w-md mx-auto">
          병영주소 기반 추적으로 닉네임을 바꿔도 놓치지 않습니다.<br className="hidden sm:block" />
          핵 유저 신고부터 비매너 유저 정보까지 한곳에서 관리하세요.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 px-4 sm:px-0">
          <Link
            href="/reports"
            className="inline-flex h-11 items-center justify-center px-6 rounded-xl bg-primary text-white text-[14px] font-semibold btn-primary shadow-toss-md"
          >
            핵 유저 목록 보기
          </Link>
          <Link
            href="/search"
            className="inline-flex h-11 items-center justify-center px-6 rounded-xl bg-card text-foreground text-[14px] font-semibold border border-border btn-secondary shadow-toss"
          >
            병영주소 검색
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-4 gap-3 sm:gap-4 py-8">
        {[
          { value: stats.hackReports.toLocaleString(), label: "핵 신고" },
          { value: stats.mannerReports.toLocaleString(), label: "비매너 신고" },
          { value: stats.nicknameChanges.toLocaleString(), label: "닉변 감지" },
          { value: stats.users.toLocaleString(), label: "가입 유저" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-4 sm:p-6 text-center shadow-toss border border-border/50">
            <p className="text-[20px] sm:text-[24px] font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] sm:text-[12px] text-toss-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="py-12">
        <h2 className="text-[20px] sm:text-[22px] font-bold text-foreground mb-2">
          이런 걸 할 수 있어요
        </h2>
        <p className="text-[13px] text-toss-gray-500 mb-8">
          흩어진 핵 유저 정보를 모으고, 자동으로 추적합니다
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: "🎯",
              title: "병영주소 기반 영구 추적",
              desc: "닉네임은 바뀌어도 병영주소는 변하지 않습니다. 한번 등록되면 영구적으로 추적됩니다.",
            },
            {
              icon: "🔄",
              title: "자동 닉네임 변경 감지",
              desc: "6시간마다 넥슨 병영 페이지를 확인하여 닉네임 변경을 자동으로 잡아냅니다.",
            },
            {
              icon: "📧",
              title: "이메일 알림",
              desc: "블랙리스트에 등록한 유저의 닉네임이 바뀌면 이메일로 즉시 알려드립니다.",
            },
            {
              icon: "⚖️",
              title: "3단계 검증 시스템",
              desc: "의심 → 유력 → 확정. 커뮤니티 투표와 관리자 최종 승인으로 신뢰도를 보장합니다.",
            },
            {
              icon: "🏷️",
              title: "비매너 신고",
              desc: "길막, 욕설, 트롤링 등 비매너 유저 정보를 별도로 공유하는 참고 시스템입니다.",
            },
            {
              icon: "🔍",
              title: "넥슨 Open API 연동",
              desc: "닉네임으로 검색하면 계급, 전적, 매치 기록 등 유저 정보를 실시간으로 조회합니다.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-5 border border-border/50 shadow-toss hover:shadow-toss-md transition-toss"
            >
              <span className="text-[24px]">{feature.icon}</span>
              <h3 className="text-[15px] font-semibold text-foreground mt-3 mb-1.5">
                {feature.title}
              </h3>
              <p className="text-[13px] text-toss-gray-500 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <h2 className="text-[20px] sm:text-[22px] font-bold text-foreground mb-8">
          어떻게 동작하나요?
        </h2>
        <div className="flex flex-col gap-4">
          {[
            { step: "1", title: "유저 검색", desc: "닉네임으로 검색하여 병영주소와 전적을 확인합니다." },
            { step: "2", title: "증거와 함께 신고", desc: "영상, 이미지, 링크 등 증거자료를 첨부하여 핵 또는 비매너 신고를 등록합니다." },
            { step: "3", title: "커뮤니티 검증", desc: "다른 유저들의 투표와 댓글로 신고 내용을 검증합니다." },
            { step: "4", title: "자동 추적", desc: "등록된 유저의 닉네임 변경을 6시간마다 감지하고, 블랙리스트 유저는 이메일로 알립니다." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start bg-card rounded-2xl p-5 border border-border/50 shadow-toss">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[14px] font-bold text-primary">{item.step}</span>
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">{item.title}</h3>
                <p className="text-[13px] text-toss-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 text-center">
        <div className="bg-card rounded-2xl p-8 sm:p-10 border border-border/50 shadow-toss-md">
          <h2 className="text-[18px] sm:text-[20px] font-bold text-foreground">
            핵 유저 정보, 지금 바로 확인하세요
          </h2>
          <p className="text-[13px] text-toss-gray-500 mt-2 mb-6">
            병영주소만 있으면 닉네임이 바뀌어도 추적할 수 있습니다
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/reports"
              className="inline-flex h-11 items-center justify-center px-8 rounded-xl bg-primary text-white text-[14px] font-semibold btn-primary shadow-toss-md"
            >
              시작하기
            </Link>
            <a
              href="https://discord.gg/tFsa42C5uP"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 px-6 rounded-xl bg-[#5865F2] text-white text-[14px] font-semibold hover:bg-[#4752C4] transition-colors shadow-toss"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              디스코드 참여
            </a>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-6 mb-4">
        <p className="text-[11px] text-toss-gray-600 dark:text-toss-gray-500 text-center leading-relaxed">
          SALog는 커뮤니티 기반 정보 공유 플랫폼이며, 등록된 정보의 정확성을 보장하지 않습니다.<br />
          모든 핵 판정은 관리자 최종 승인을 거치며, 증거 기반으로 운영됩니다.
        </p>
      </section>
    </div>
  );
}
