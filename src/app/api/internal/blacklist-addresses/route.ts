import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalKey } from "@/lib/internal-auth";

export async function GET(req: NextRequest) {
  if (!verifyInternalKey(req.headers.get("x-internal-key"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [hackAddresses, mannerAddresses] = await Promise.all([
    prisma.hackReport.findMany({
      where: { barracksAddress: { not: "" } },
      select: { barracksAddress: true, nickname: true },
      distinct: ["barracksAddress"],
    }),
    prisma.mannerTag.findMany({
      where: { barracksAddress: { not: "" } },
      select: { barracksAddress: true, nickname: true },
      distinct: ["barracksAddress"],
    }),
  ]);

  const allAddresses = new Map<string, string>();
  for (const r of [...hackAddresses, ...mannerAddresses]) {
    if (!allAddresses.has(r.barracksAddress)) {
      allAddresses.set(r.barracksAddress, r.nickname);
    }
  }

  const statuses = await prisma.crawlStatus.findMany({
    where: { barracksAddress: { in: [...allAddresses.keys()] } },
  });
  const statusMap = new Map(statuses.map(s => [s.barracksAddress, s]));

  const addresses = [...allAddresses.entries()].map(([addr, nickname]) => {
    const status = statusMap.get(addr);
    return {
      barracksAddress: addr,
      lastNickname: status?.lastNickname ?? nickname,
    };
  });

  return NextResponse.json({ addresses });
}
