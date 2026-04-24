import { z } from "zod/v4";
import { db } from "@/db/client";
import { duel, duelParticipant, settlement, payout, chainTx, ledgerEntry, auditLog } from "@/db/schema";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { eq, sql } from "drizzle-orm";
import { generateToken } from "@/lib/token";

const settleSchema = z.object({
  duelId: z.string().uuid(),
  winningSide: z.enum(["A", "B"]),
  adminId: z.string().uuid(),
});

export async function POST(req: Request) {
  const requestId = genRequestId();

  let body;
  try { body = settleSchema.parse(await req.json()); } catch { return err(ERR.VALIDATION, "Invalid request", requestId); }

  const d = await db.query.duel.findFirst({ where: eq(duel.id, body.duelId) });
  if (!d) return err(ERR.NOT_FOUND, "Duel not found", requestId, 404);
  if (d.status !== "closed") return err(ERR.CONFLICT, "Duel must be closed to settle", requestId, 409);

  // Check idempotency — one settlement per duel
  const existing = await db.query.settlement.findFirst({ where: eq(settlement.duelId, body.duelId) });
  if (existing) return err(ERR.CONFLICT, "Already settled", requestId, 409);

  const participants = await db.query.duelParticipant.findMany({ where: eq(duelParticipant.duelId, body.duelId) });

  const totalPool = participants.reduce((sum, p) => sum + parseFloat(p.stakeAmount), 0);
  const market = await db.query.market.findFirst({ where: eq(duel.marketId, d.marketId) });
  const feeBps = market?.feeBps ?? 200;
  const feeAmount = totalPool * feeBps / 10000;
  const distributableAmount = totalPool - feeAmount;

  const winners = participants.filter((p) => p.side === body.winningSide);
  const totalWinnerStake = winners.reduce((sum, p) => sum + parseFloat(p.stakeAmount), 0);

  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS ?? "PLATFORM";
  const usdcMint = process.env.SOLANA_USDC_MINT ?? "USDC_MINT";

  const result = await db.transaction(async (tx) => {
    // Create settlement
    const [s] = await tx.insert(settlement).values({
      duelId: body.duelId,
      winningSide: body.winningSide,
      feeAmount: feeAmount.toFixed(6),
      distributableAmount: distributableAmount.toFixed(6),
      decidedByActorType: "admin",
      decidedByActorId: body.adminId,
    }).returning();

    // Fee chain_tx + ledger
    const feeIdemKey = `fee:${body.duelId}`;
    const [feeTx] = await tx.insert(chainTx).values({
      txType: "fee",
      idempotencyKey: feeIdemKey,
      fromAddress: platformWallet,
      toAddress: platformWallet,
      amount: feeAmount.toFixed(6),
      tokenMint: usdcMint,
      relatedEntityType: "settlement",
      relatedEntityId: s.id,
    }).returning();

    await tx.insert(ledgerEntry).values({
      duelId: body.duelId,
      entryType: "fee",
      amount: feeAmount.toFixed(6),
      chainTxId: feeTx.id,
      idempotencyKey: feeIdemKey,
    });

    // Payouts for all participants
    for (const p of participants) {
      const isWinner = p.side === body.winningSide;
      const payoutAmount = isWinner && totalWinnerStake > 0
        ? distributableAmount * (parseFloat(p.stakeAmount) / totalWinnerStake)
        : 0;

      const payoutIdemKey = `payout:${body.duelId}:${p.id}`;

      let payoutChainTxId: string | undefined;
      if (payoutAmount > 0) {
        const [payoutTx] = await tx.insert(chainTx).values({
          txType: "payout",
          idempotencyKey: payoutIdemKey,
          fromAddress: platformWallet,
          toAddress: platformWallet, // Will be resolved to user wallet by worker
          amount: payoutAmount.toFixed(6),
          tokenMint: usdcMint,
          relatedEntityType: "duel_participant",
          relatedEntityId: p.id,
        }).returning();
        payoutChainTxId = payoutTx.id;

        await tx.insert(ledgerEntry).values({
          duelId: body.duelId,
          userId: p.userId,
          entryType: "payout",
          amount: payoutAmount.toFixed(6),
          chainTxId: payoutTx.id,
          idempotencyKey: payoutIdemKey,
        });
      }

      await tx.insert(payout).values({
        settlementId: s.id,
        duelParticipantId: p.id,
        payoutAmount: payoutAmount.toFixed(6),
        payoutChainTxId: payoutChainTxId,
      });
    }

    // Update duel status
    await tx.update(duel).set({
      status: "resolving",
      updatedAt: new Date(),
      version: sql`${duel.version} + 1`,
    }).where(eq(duel.id, body.duelId));

    return s;
  });

  await db.insert(auditLog).values({
    actorType: "admin",
    actorId: body.adminId,
    action: "ADMIN_TRIGGER_SETTLEMENT",
    entityType: "settlement",
    entityId: result.id,
    requestId,
    after: { winningSide: body.winningSide, feeAmount: feeAmount.toFixed(6), distributableAmount: distributableAmount.toFixed(6) },
  });

  return ok({ settlementId: result.id }, requestId);
}
