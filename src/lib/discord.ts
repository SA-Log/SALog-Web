const WEBHOOK_NICKNAME = process.env.DISCORD_WEBHOOK_NICKNAME ?? "";
const WEBHOOK_HACK_CONFIRMED = process.env.DISCORD_WEBHOOK_HACK_CONFIRMED ?? "";
const WEBHOOK_NEW_REPORT = process.env.DISCORD_WEBHOOK_NEW_REPORT ?? "";

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: EmbedField[];
  timestamp?: string;
  footer?: { text: string };
  url?: string;
}

async function sendWebhook(url: string, content: string, embeds?: DiscordEmbed[]) {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, embeds }),
    });
  } catch {
    console.error("[discord] 웹훅 전송 실패");
  }
}

// 닉네임 변경 알림
export async function notifyNicknameChange(params: {
  oldNickname: string;
  newNickname: string;
  barracksAddress: string;
}) {
  const { oldNickname, newNickname, barracksAddress } = params;
  await sendWebhook(WEBHOOK_NICKNAME, "", [{
    title: "🔄 닉네임 변경 감지",
    description: `**${oldNickname}** → **${newNickname}**`,
    color: 0xf59f00,
    fields: [
      { name: "병영주소", value: `[바로가기](https://barracks.sa.nexon.com/${barracksAddress}/match)`, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "SALog 닉변 감지" },
  }]);
}

// 핵 확정 알림
export async function notifyHackConfirmed(params: {
  nickname: string;
  reportId: string;
  barracksAddress?: string;
}) {
  const { nickname, reportId, barracksAddress } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sa-log-web.vercel.app";
  await sendWebhook(WEBHOOK_HACK_CONFIRMED, "", [{
    title: "🚨 핵 사용 확정",
    description: `**${nickname}** 유저가 핵 사용으로 확정되었습니다.`,
    color: 0xf04452,
    fields: [
      { name: "신고 페이지", value: `[바로가기](${appUrl}/reports/${reportId})`, inline: true },
      ...(barracksAddress ? [{ name: "병영수첩", value: `[바로가기](https://barracks.sa.nexon.com/${barracksAddress}/match)`, inline: true }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "SALog 핵 판정" },
  }]);
}

// 신규 신고 알림
export async function notifyNewReport(params: {
  type: "hack" | "manner";
  nickname: string;
  reportId: string;
  reporterName: string;
  description?: string | null;
}) {
  const { type, nickname, reportId, reporterName, description } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sa-log-web.vercel.app";
  const isHack = type === "hack";
  const path = isHack ? "reports" : "manner";

  await sendWebhook(WEBHOOK_NEW_REPORT, "", [{
    title: isHack ? "🎯 새 핵 신고" : "⚠️ 새 비매너 신고",
    description: `**${reporterName}**님이 **${nickname}** 유저를 신고했습니다.`,
    color: isHack ? 0xf04452 : 0xf59f00,
    fields: [
      { name: "신고 페이지", value: `[바로가기](${appUrl}/${path}/${reportId})`, inline: true },
      ...(description ? [{ name: "사유", value: description.slice(0, 200) }] : []),
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "SALog 신고 알림" },
  }]);
}
