import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "병영주소 URL이 필요합니다.", found: false }, { status: 400 });
    }

    const barracksPattern = /^https?:\/\/barracks\.sa\.nexon\.com\/(\d+)/;
    const match = url.match(barracksPattern);
    if (!match) {
      return NextResponse.json({ error: "올바른 병영주소 URL 형식이 아닙니다.", found: false }, { status: 400 });
    }

    // detail 페이지로 정규화 (닉네임이 표시되는 페이지)
    const detailUrl = `https://barracks.sa.nexon.com/${match[1]}/detail`;

    const browser = await chromium.launch({
      headless: false,
      args: ["--disable-blink-features=AutomationControlled"],
    });

    try {
      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        locale: "ko-KR",
      });
      const page = await context.newPage();

      await page.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
      });

      await page.goto(detailUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForSelector("p.nick", { timeout: 20000 });

      const nickname = await page.locator("p.nick").first().textContent();
      await browser.close();

      if (!nickname?.trim()) {
        return NextResponse.json({ found: false, error: "닉네임을 찾을 수 없습니다." });
      }

      return NextResponse.json({ found: true, nickname: nickname.trim() });
    } catch {
      await browser.close();
      return NextResponse.json({ found: false, error: "병영 페이지에서 닉네임을 가져올 수 없습니다." });
    }
  } catch {
    return NextResponse.json({ found: false, error: "조회 중 오류가 발생했습니다." });
  }
}
