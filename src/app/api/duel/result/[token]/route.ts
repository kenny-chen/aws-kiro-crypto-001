import { db } from "@/db/client";
import { duel, settlement, payout, duelParticipant, chainTx } from "@/db/schema";
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
  if (!["resolved", "refunded"].includes(d.status)) {
    return err(ERR.CONFLICT, "Results not yet available", requestId, 409);
  }

  const s = await db.query.settlement.findFirst({ where: eq(settlement.duelId, d.id) });
  const payouts = await db.query.payout.findMany({ where: s ? eq(payout.settlementId, s.id) : undefined });
  const participants = await db.query.duelParticipant.findMany({ where: eq(duelParticipant.duelId, d.id) });

  const payoutDetails = await Promise.all(
    payouts.map(async (p) => {
      const participant = participants.find((pp) => pp.id === p.duelParticipantId);
      const tx = p.payoutChainTxId ? await db.query.chainTx.findFirst({ where: eq(chainTx.id, p.payoutChainTxId) }) : null;
      return {
        participantId: p.duelParticipantId,
        userId: participant?.userId,
        side: participant?.side,
        stakeAmount: participant?.stakeAmount,
        payoutAmount: p.payoutAmount,
        payoutStatus: p.status,
        chainTxSignature: tx?.signature,
        chainTxStatus: tx?.status,
      };
    })
  );

  return ok({
    duelId: d.id,
    duelStatus: d.status,
    settlement: s ? {
      winningSide: s.winningSide,
      feeAmount: s.feeAmount,
      distributableAmount: s.distributableAmount,
      decidedAt: s.decidedAt.toISOString(),
      disputeWindowEndsAt: s.disputeWindowEndsAt?.toISOString(),
    } : null,
    payouts: payoutDetails,
  }, requestId);
}
