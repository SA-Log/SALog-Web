import { handleVote } from "@/lib/post-interaction";

export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handleVote(req, ctx, "hack");
}
