import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireVerified } from "@/lib/require-verified";
import { grantExp, EXP_TABLE } from "@/lib/exp";

/** 투표·댓글 대상 게시글 종류 */
export type PostKind = "hack" | "manner";

type RouteParams = { params: Promise<{ id: string }> };

const PROMOTION_MIN_VOTES = 5;
const PROMOTION_AGREE_RATIO = 0.7;

function postRef(kind: PostKind, id: string) {
  return kind === "hack" ? { hackReportId: id } : { mannerTagId: id };
}

async function findPostAuthor(kind: PostKind, id: string): Promise<{ reporterId: string } | null> {
  const select = { reporterId: true } as const;
  return kind === "hack"
    ? prisma.hackReport.findUnique({ where: { id }, select })
    : prisma.mannerTag.findUnique({ where: { id }, select });
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/** 로그인 + 병영수첩 인증 + rate limit 공통 가드. 통과 시 userId, 실패 시 에러 응답 */
async function guard(
  scope: "vote" | "comment",
  limit: number,
): Promise<{ userId: string } | { error: NextResponse }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 }) };
  }
  const userId = session.user.id;

  const verifyErr = await requireVerified(userId);
  if (verifyErr) return { error: NextResponse.json({ error: verifyErr }, { status: 403 }) };

  const rl = rateLimit(`${scope}:${userId}`, { limit, windowSec: 60 });
  if (!rl.success) {
    return { error: NextResponse.json({ error: "요청이 너무 많습니다" }, { status: 429 }) };
  }
  return { userId };
}

/** 찬성률 70% 이상 + 최소 5표 이상이면 SUSPECT → PROBABLE 자동 승격 */
async function promoteIfConsensus(hackReportId: string): Promise<void> {
  const [total, agree] = await Promise.all([
    prisma.vote.count({ where: { hackReportId } }),
    prisma.vote.count({ where: { hackReportId, voteType: "AGREE" } }),
  ]);
  if (total < PROMOTION_MIN_VOTES || agree / total < PROMOTION_AGREE_RATIO) return;

  // 조건부 업데이트로 원자적 승격 (동시 요청에도 한 번만 반영)
  await prisma.hackReport.updateMany({
    where: { id: hackReportId, status: "SUSPECT" },
    data: { status: "PROBABLE" },
  });
}

export async function handleVote(req: Request, { params }: RouteParams, kind: PostKind) {
  const g = await guard("vote", 30);
  if ("error" in g) return g.error;
  const { userId } = g;

  const { id } = await params;
  const body = await req.json();
  const voteType = body.voteType;
  if (voteType !== "AGREE" && voteType !== "DISAGREE") {
    return NextResponse.json({ error: "올바른 투표 유형이 아닙니다" }, { status: 400 });
  }

  const post = await findPostAuthor(kind, id);
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }
  if (post.reporterId === userId) {
    return NextResponse.json({ error: "본인 글에는 투표할 수 없습니다" }, { status: 403 });
  }

  // 중복 여부는 DB unique 제약으로 판단 (사전 조회 시 동시 요청에서 race 발생)
  try {
    await prisma.vote.create({ data: { ...postRef(kind, id), userId, voteType } });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({ error: "이미 투표했습니다" }, { status: 409 });
    }
    throw e;
  }

  grantExp(userId, EXP_TABLE.vote).catch(() => {});

  if (kind === "hack") await promoteIfConsensus(id);

  return NextResponse.json({ success: true });
}

export async function handleComment(req: Request, { params }: RouteParams, kind: PostKind) {
  const g = await guard("comment", 20);
  if ("error" in g) return g.error;
  const { userId } = g;

  const { id } = await params;
  const body = await req.json();
  const content = body.content?.trim();
  if (!content || content.length > 500) {
    return NextResponse.json({ error: "댓글 내용을 확인해주세요 (최대 500자)" }, { status: 400 });
  }

  const post = await findPostAuthor(kind, id);
  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: { ...postRef(kind, id), userId, content },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { id: true, nickname: true, image: true } },
    },
  });

  grantExp(userId, EXP_TABLE.comment).catch(() => {});

  return NextResponse.json(comment, { status: 201 });
}
