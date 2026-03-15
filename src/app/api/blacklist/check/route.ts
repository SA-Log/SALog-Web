import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ exists: false });
  }

  const barracksAddress = req.nextUrl.searchParams.get("barracksAddress");
  if (!barracksAddress) {
    return NextResponse.json({ exists: false });
  }

  const entry = await prisma.blacklistEntry.findUnique({
    where: {
      userId_barracksAddress: {
        userId: session.user.id,
        barracksAddress,
      },
    },
  });

  return NextResponse.json({ exists: !!entry });
}
