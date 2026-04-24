import { z } from "zod/v4";
import { db } from "@/db/client";
import { duel, duelParticipant, chainTx, ledgerEntry, auditLog } from "@/db/schema";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { eq, sql } from "drizzle-orm";

const refundSchema = z.object({
  duelId: z.string().uuid(),
  adminId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  const requestId = genRequestId();

  let body;
  try { body = refundSchema.parse(await req.json()); } catch { return err(ERR.VALIDATION, "Invalid request", requestId); }

  const d = await db.query.duel.findFirst({ where: eq(duel.id, body.duelId) });
  if (!d) return err(ERR.NOT_FOUND, "Duel not found", requestId, 404);
  if (!["open", "closed"].includes(d.status)) {
    return err(ERR.CONFLICT, `Cannot refund duel in ${d.status} state`, requestId, 409);
  }

  const participants = await db.query.duelParticipant.findMany({ where: eq(duelParticipant.duelId, body.duelId) });
  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS ?? "PLATFORM";
  const usdcMint = process.env.SOLANA_USDC_MINT ?? "USDC_MINT";

  await db.transaction(async (tx) => {
    for (const p of participants) {
      if (p.status !== "active") continue;
      const idemKey = `refund:${body.duelId}:${p.id}`;

      const [refundTx] = await tx.insert(chainTx).values({
        txType: "refund",
        idempotencyKey: idemKey,
        fromAddress: platformWallet,
        toAddress: platformWallet,
        amount: p.stakeAmount,
        tokenMint: usdcMint,
        relatedEntityType: "duel_participant",
        relatedEntityId: p.id,
      }).returning();

      await tx.insert(ledgerEntry).values({
        duelId: body.duelId,
        userId: p.userId,
        entryType: "refund",
        amount: p.stakeAmount,
        chainTxId: refundTx.id,
        idempotencyKey: idemKey,
        note: body.reason,
      });

      await tx.update(duelParticipant).set({ status: "refunded", cancelledAt: new Date() }).where(eq(duelParticipant.id, p.id));
    }

    await tx.update(duel).set({
      status: "refunding",
      updatedAt: new Date(),
      version: sql`${duel.version} + 1`,
    }).where(eq(duel.id, body.duelId));
  });

  await db.insert(auditLog).values({
    actorType: "admin",
    actorId: body.adminId,
    action: "ADMIN_TRIGGER_REFUND",
    entityType: "duel",
    entityId: body.duelId,
    requestId,
    after: { reason: body.reason, participantCount: participants.length },
  });

  return ok({ duelId: body.duelId, status: "refunding" }, requestId);
}
