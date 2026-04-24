import { db } from "@/db/client";
import { duel, chainTx, payout, auditLog } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { sendUsdcTransfer, confirmTransaction } from "./solana";
import { logger } from "@/lib/logger";

// ── Close expired duels ──
export async function closeDuels() {
  const now = new Date();
  const openDuels = await db
    .select()
    .from(duel)
    .where(and(eq(duel.status, "open"), lte(duel.closeAt, now)));

  for (const d of openDuels) {
    const result = await db
      .update(duel)
      .set({ status: "closed", updatedAt: now, version: sql`${duel.version} + 1` })
      .where(and(eq(duel.id, d.id), eq(duel.version, d.version)))
      .returning();

    if (result.length > 0) {
      await db.insert(auditLog).values({
        actorType: "worker",
        action: "DUEL_CLOSED",
        entityType: "duel",
        entityId: d.id,
        after: { previousVersion: d.version },
      });
      logger.info("Duel closed", { duelId: d.id });
    }
  }
}

// ── Process pending payouts ──
export async function processPayouts() {
  const pending = await db
    .select()
    .from(payout)
    .where(eq(payout.status, "pending"))
    .limit(20);

  for (const p of pending) {
    if (!p.payoutChainTxId) continue;

    const tx = await db.query.chainTx.findFirst({ where: eq(chainTx.id, p.payoutChainTxId) });
    if (!tx) continue;

    if (tx.status === "submitted") {
      // Try to send
      const result = await sendUsdcTransfer({
        chainTxId: tx.id,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        amount: parseFloat(tx.amount),
      });

      if ("error" in result) {
        await db.update(payout).set({ status: "failed", error: result.error }).where(eq(payout.id, p.id));
        await db.insert(auditLog).values({
          actorType: "worker",
          action: "WORKER_PAYOUT_FAILED",
          entityType: "duel",
          entityId: p.settlementId,
          after: { payoutId: p.id, error: result.error },
        });
      }
    }

    // Confirm
    const status = await confirmTransaction(tx.id);
    if (status === "confirmed") {
      await db.update(payout).set({ status: "paid", paidAt: new Date() }).where(eq(payout.id, p.id));
      await db.insert(auditLog).values({
        actorType: "worker",
        action: "WORKER_PAYOUT_CONFIRMED",
        entityType: "duel",
        entityId: p.settlementId,
        after: { payoutId: p.id },
      });
    } else if (status === "failed") {
      await db.update(payout).set({ status: "failed", error: "Chain confirmation failed" }).where(eq(payout.id, p.id));
    }
  }
}

// ── Reconciliation stats ──
export async function getReconcileStats() {
  const [pendingTx] = await db.select({ count: sql<number>`count(*)` }).from(chainTx).where(eq(chainTx.status, "submitted"));
  const [failedTx] = await db.select({ count: sql<number>`count(*)` }).from(chainTx).where(eq(chainTx.status, "failed"));
  const [pendingPayouts] = await db.select({ count: sql<number>`count(*)` }).from(payout).where(eq(payout.status, "pending"));
  const [failedPayouts] = await db.select({ count: sql<number>`count(*)` }).from(payout).where(eq(payout.status, "failed"));

  return {
    pendingTransactions: pendingTx.count,
    failedTransactions: failedTx.count,
    pendingPayouts: pendingPayouts.count,
    failedPayouts: failedPayouts.count,
  };
}
