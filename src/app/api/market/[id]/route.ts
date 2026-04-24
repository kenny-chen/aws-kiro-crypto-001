import { db } from "@/db/client";
import { market } from "@/db/schema";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = genRequestId();
  const { id } = await params;

  const m = await db.query.market.findFirst({ where: eq(market.id, id) });
  if (!m) return err(ERR.NOT_FOUND, "Market not found", requestId, 404);

  return ok({
    id: m.id,
    title: m.title,
    optionALabel: m.optionALabel,
    optionBLabel: m.optionBLabel,
    resolutionAt: m.resolutionAt.toISOString(),
    minStake: m.minStake,
    feeBps: m.feeBps,
    status: m.status,
    review: m.review,
    createdAt: m.createdAt.toISOString(),
  }, requestId);
}
