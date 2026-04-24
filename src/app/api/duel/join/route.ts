import { z } from "zod/v4";
import { db } from "@/db/client";
import { duel, duelParticipant, market, chainTx, ledgerEntry, auditLog, userAccount } from "@/db/schema";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { generateToken } from "@/lib/token";
import { isPast } from "@/lib/time";
import { eq, and, sql } from "drizzle-orm";

const joinSchema = z.object({
  duelToken: z.string().min(16),
  userId: z.string().uuid(),
  side: z.enum(["A", "B"]),
  stakeAmount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  walletAddress: z.string().min(32),
});

export async function POST(req: Request) {
  const requestId = genRequestId();

  let body;
  try {
    body = joinSchema.parse(await req.json());
  } catch {
    return err(ERR.VALIDATION, "Invalid join data", requestId);
  }

  const user = await db.query.userAccount.findFirst({ where: eq(userAccount.id, body.userId) });
  if (!user || user.status !== "active") return err(ERR.FORBIDDEN, "User not active", requestId, 403);

  const d = await db.query.duel.findFirst({ where: eq(duel.inviteToken, body.duelToken) });
  if (!d) return err(ERR.NOT_FOUND, "Duel not found", requestId, 404);
  if (d.status !== "open") return err(ERR.CONFLICT, "Duel is not open", requestId, 409);
  if (isPast(d.closeAt)) return err(ERR.EXPIRED, "Duel pool is closed", requestId, 410);

  const m = await db.query.market.findFirst({ where: eq(market.id, d.marketId) });
  if (!m || m.status !== "active") return err(ERR.CONFLICT, "Market not available", requestId, 409);

  if (parseFloat(body.stakeAmount) < parseFloat(m.minStake)) {
    return err(ERR.VALIDATION, `Stake must be at least ${m.minStake} USDC`, requestId);
  }

  // Check duplicate
  const existing = await db.query.duelParticipant.findFirst({
    where: and(eq(duelParticipant.duelId, d.id), eq(duelParticipant.userId, body.userId)),
  });
  if (existing) return err(ERR.CONFLICT, "Already joined this duel", requestId, 409);

  const idempotencyKey = `deposit:${d.id}:${body.userId}`;
  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS ?? "PLATFORM";
  const usdcMint = process.env.SOLANA_USDC_MINT ?? "USDC_MINT";

  // Transaction: create participant + chain_tx + ledger_entry + update duel totals
  const result = await db.transaction(async (tx) => {
    const [txRecord] = await tx.insert(chainTx).values({
      txType: "deposit",
      idempotencyKey,
      fromAddress: body.walletAddress,
      toAddress: platformWallet,
      amount: body.stakeAmount,
      tokenMint: usdcMint,
      relatedEntityType: "duel_participant",
      relatedEntityId: d.id,
    }).returning();

    const [participant] = await tx.insert(duelParticipant).values({
      duelId: d.id,
      userId: body.userId,
      side: body.side,
      stakeAmount: body.stakeAmount,
      depositChainTxId: txRecord.id,
    }).returning();

    await tx.insert(ledgerEntry).values({
      duelId: d.id,
      userId: body.userId,
      entryType: "deposit",
      amount: body.stakeAmount,
      chainTxId: txRecord.id,
      idempotencyKey,
    });

    // Update duel aggregates
    const stakeCol = body.side === "A" ? duel.totalStakeA : duel.totalStakeB;
    await tx.update(duel).set({
      [body.side === "A" ? "totalStakeA" : "totalStakeB"]: sql`${stakeCol} + ${body.stakeAmount}::numeric`,
      participantCount: sql`${duel.participantCount} + 1`,
      version: sql`${duel.version} + 1`,
      updatedAt: new Date(),
    }).where(eq(duel.id, d.id));

    return { participant, txRecord };
  });

  await db.insert(auditLog).values({
    actorType: "user",
    actorId: body.userId,
    action: "JOIN_AND_DEPOSIT",
    entityType: "duel_participant",
    entityId: result.participant.id,
    requestId,
    after: { side: body.side, stakeAmount: body.stakeAmount, chainTxId: result.txRecord.id },
  });

  return ok({ participantId: result.participant.id, chainTxId: result.txRecord.id }, requestId);
}
