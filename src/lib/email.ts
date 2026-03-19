import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "SALog <onboarding@resend.dev>";

export async function sendNicknameChangeAlert(params: {
  to: string;
  oldNickname: string;
  newNickname: string;
  barracksAddress: string;
}) {
  const { to, oldNickname, newNickname, barracksAddress } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://salog.kr";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `[SALog] 블랙리스트 유저 닉네임 변경: ${oldNickname} → ${newNickname}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="font-size:18px;font-weight:700;color:#191f28;margin:0 0 16px">닉네임 변경 감지</h2>
        <div style="background:#f9fafb;border:1px solid #e5e8eb;border-radius:12px;padding:16px;margin-bottom:16px">
          <p style="font-size:14px;color:#4e5968;margin:0 0 8px">블랙리스트에 등록한 유저의 닉네임이 변경되었습니다.</p>
          <p style="font-size:16px;font-weight:700;color:#191f28;margin:0">
            <span style="color:#f04452">${oldNickname}</span>
            <span style="color:#8b95a1;margin:0 8px">→</span>
            <span style="color:#3182f6">${newNickname}</span>
          </p>
        </div>
        <a href="${appUrl}/search/player?name=${encodeURIComponent(newNickname)}&nexonSn=${barracksAddress}" 
           style="display:inline-block;background:#3182f6;color:#fff;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none">
          유저 프로필 보기
        </a>
        <p style="font-size:11px;color:#8b95a1;margin:16px 0 0">
          이 알림은 SALog 블랙리스트에 등록한 유저의 닉네임이 변경될 때 발송됩니다.
        </p>
      </div>
    `,
  });
}
