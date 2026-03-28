import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();
const CRAWLER_URL = process.env.CRAWLER_URL ?? "http://localhost:3001";
const CRAWLER_API_KEY = process.env.CRAWLER_API_KEY ?? "";

async function lookupNickname(nexonSn: string): Promise<string | null> {
  try {
    const res = await fetch(`${CRAWLER_URL}/api/barracks/profile?nexonSn=${nexonSn}`, {
      headers: { "x-api-key": CRAWLER_API_KEY },
    });
    const data = await res.json();
    return data.found && data.nickname ? data.nickname : null;
  } catch { return null; }
}

function extractAddress(input: string): string {
  const match = input.match(/barracks\.sa\.nexon\.com\/(\d+)/);
  if (match) return match[1];
  const num = input.match(/(\d{5,})/);
  if (num) return num[1];
  return input.trim();
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("사용법: npx tsx scripts/bulk-import.ts data.json");
    process.exit(1);
  }

  const master = await prisma.user.findFirst({ where: { role: "MASTER" }, select: { id: true, nickname: true } });
  if (!master) { console.error("MASTER 유저가 필요합니다"); process.exit(1); }
  console.log(`관리자: ${master.nickname} (${master.id})\n`);

  const fs = await import("fs");
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const entries: { addr: string; nick?: string }[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string") entries.push({ addr: extractAddress(item) });
      else entries.push({ addr: extractAddress(item.barracksAddress || item.address || item.nexonSn || item.url || ""), nick: item.nickname || item.name });
    }
  }

  console.log(`총 ${entries.length}건\n`);
  let ok = 0, skip = 0, fail = 0;

  for (let i = 0; i < entries.length; i++) {
    const { addr, nick } = entries[i];
    if (!addr || addr.length < 5) { console.log(`[${i+1}] 건너뜀 (잘못된 주소)`); skip++; continue; }

    const exists = await prisma.hackReport.findFirst({ where: { barracksAddress: addr }, select: { id: true } });
    if (exists) { console.log(`[${i+1}] 건너뜀 (이미 등록): ${addr}`); skip++; continue; }

    let nickname = nick;
    if (!nickname) {
      nickname = await lookupNickname(addr);
      if (!nickname) { console.log(`[${i+1}] 실패 (닉네임 조회): ${addr}`); fail++; continue; }
      await new Promise(r => setTimeout(r, 1500));
    }

    try {
      await prisma.hackReport.create({
        data: { barracksAddress: addr, nickname, hackTypes: ["other"], description: "커뮤니티 데이터 이관", reporterId: master.id },
      });
      console.log(`[${i+1}] 등록: ${nickname} (${addr})`); ok++;
    } catch { console.log(`[${i+1}] 실패: ${addr}`); fail++; }
  }

  console.log(`\n완료: 성공 ${ok} / 건너뜀 ${skip} / 실패 ${fail}`);
  await prisma.$disconnect();
}

main().catch(console.error);
