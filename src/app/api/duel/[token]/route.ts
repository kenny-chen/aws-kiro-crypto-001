import { db } from "@/db/client";
import { duel, market } from "@/db/schema";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const requestId = genRequestId();
  const { token } = await params;

  const d = await db.query.duel.findFirst({ where: eq(duel.inviteToken, token) });
  if (!d) return err(ERR.NOT_FOUND, "Duel not found", requestId, 404);

  const m = await db.query.market.findFirst({ where: eq(market.id, d.marketId) });

  return ok({
    duelId: d.id,
    status: d.status,
    closeAt: d.closeAt.toISOString(),
    totalStakeA: d.totalStakeA,
    totalStakeB: d.totalStakeB,
    participantCount: d.participantCount,
    market: m ? {
      title: m.title,
      optionALabel: m.optionALabel,
      optionBLabel: m.optionBLabel,
      minStake: m.minStake,
      feeBps: m.feeBps,
    } : null,
  }, requestId);
}
