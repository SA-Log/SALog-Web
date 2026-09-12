import { handleComment } from "@/lib/post-interaction";

export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handleComment(req, ctx, "manner");
}
