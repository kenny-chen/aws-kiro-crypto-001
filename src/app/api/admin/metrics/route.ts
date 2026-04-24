import { db } from "@/db/client";
import { invite, userAccount, duelParticipant, settlement, ledgerEntry, duel } from "@/db/schema";
import { ok, genRequestId } from "@/lib/api";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  const requestId = genRequestId();

  const [inviteOpened] = await db.select({ count: sql<number>`count(*)` }).from(invite).where(sql`${invite.openedAt} is not null`);
  const [walletConnected] = await db.select({ count: sql<number>`count(*)` }).from(userAccount);
  const [deposited] = await db.select({ count: sql<number>`count(*)` }).from(duelParticipant);
  const [settled] = await db.select({ count: sql<number>`count(*)` }).from(settlement);

  const [totalDeposits] = await db.select({ sum: sql<string>`coalesce(sum(${ledgerEntry.amount}), '0')` }).from(ledgerEntry).where(eq(ledgerEntry.entryType, "deposit"));
  const [totalFees] = await db.select({ sum: sql<string>`coalesce(sum(${ledgerEntry.amount}), '0')` }).from(ledgerEntry).where(eq(ledgerEntry.entryType, "fee"));
  const [totalRefunds] = await db.select({ sum: sql<string>`coalesce(sum(${ledgerEntry.amount}), '0')` }).from(ledgerEntry).where(eq(ledgerEntry.entryType, "refund"));

  const [totalDuels] = await db.select({ count: sql<number>`count(*)` }).from(duel);

  return ok({
    funnel: {
      invitesOpened: inviteOpened.count,
      walletsConnected: walletConnected.count,
      depositsCount: deposited.count,
      settlementsCount: settled.count,
    },
    revenue: {
      totalDeposits: totalDeposits.sum,
      totalFees: totalFees.sum,
      totalRefunds: totalRefunds.sum,
    },
    overview: {
      totalDuels: totalDuels.count,
    },
  }, requestId);
}
