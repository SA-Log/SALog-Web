import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수가 설정되지 않았습니다");
  return createClient(url, key);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      nickname: true,
      image: true,
      bio: true,
      isProfilePublic: true,
      notifyBlacklistNickchange: true,
      notifyFollowBlacklist: true,
      barracksVerified: true,
      barracksAddress: true,
      _count: {
        select: {
          followers: true,
          following: true,
          hackReports: true,
          blacklist: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    reportCount: user._count.hackReports,
    blacklistCount: user._count.blacklist,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`profile-update:${session.user.id}`, {
    limit: 10,
    windowSec: 60,
  });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const formData = await req.formData();
  const bio = formData.get("bio") as string | null;
  const isProfilePublic = formData.get("isProfilePublic") as string | null;
  const avatarFile = formData.get("avatar") as File | null;

  const updateData: Record<string, unknown> = {};

  // Bio 업데이트
  if (bio !== null) {
    updateData.bio = bio.trim().slice(0, 100);
  }

  // 프로필 공개 설정
  if (isProfilePublic !== null) {
    updateData.isProfilePublic = isProfilePublic === "true";
  }

  // 알림 설정
  const notifyBlacklist = formData.get("notifyBlacklistNickchange") as string | null;
  if (notifyBlacklist !== null) {
    updateData.notifyBlacklistNickchange = notifyBlacklist === "true";
  }
  const notifyFollow = formData.get("notifyFollowBlacklist") as string | null;
  if (notifyFollow !== null) {
    updateData.notifyFollowBlacklist = notifyFollow === "true";
  }

  // 프로필 사진 업로드
  if (avatarFile && avatarFile.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(avatarFile.type)) {
      return NextResponse.json(
        { error: "JPG, PNG, WebP만 지원합니다" },
        { status: 400 }
      );
    }
    if (avatarFile.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { error: "프로필 사진은 5MB 이하여야 합니다" },
        { status: 400 }
      );
    }

    try {
      const supabase = getSupabase();
      const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ext.replace(/[^a-z0-9]/g, "");
      const filePath = `avatars/${session.user.id}/${Date.now()}.${safeExt}`;
      const buffer = await avatarFile.arrayBuffer();

      const { error } = await supabase.storage
        .from("uploads")
        .upload(filePath, buffer, {
          contentType: avatarFile.type,
          upsert: false,
        });

      if (error) {
        console.error("[profile/me] Supabase upload error:", error);
        return NextResponse.json(
          { error: `사진 업로드 실패: ${error.message}` },
          { status: 500 }
        );
      }

      const { data: urlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);

      updateData.image = urlData.publicUrl;
    } catch (e) {
      console.error("[profile/me] Avatar upload catch:", e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "사진 업로드 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }
  }

  // 프로필 사진 제거
  if (formData.get("removeAvatar") === "true") {
    updateData.image = null;
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        nickname: true,
        image: true,
        bio: true,
        isProfilePublic: true,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "프로필 업데이트에 실패했습니다" }, { status: 500 });
  }
}
