import { db } from "@/db/client";
import { invite, duel, market, auditLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type InviteState = "landing" | "expired" | "invalid";

export type InviteData = {
  state: InviteState;
  marketTitle?: string;
  optionA?: string;
  optionB?: string;
  minStake?: string;
  feeBps?: number;
  closeAt?: string;
  duelStatus?: string;
  totalStakeA?: string;
  totalStakeB?: string;
  participantCount?: number;
  duelToken?: string;
};

export async function resolveInvite(token: string): Promise<InviteData> {
  // Find invite by token
  const inv = await db.query.invite.findFirst({
    where: eq(invite.token, token),
  });

  if (!inv) return { state: "invalid" };

  // Mark opened
  if (!inv.openedAt) {
    await db.update(invite).set({ openedAt: new Date() }).where(eq(invite.id, inv.id));
    await db.insert(auditLog).values({
      actorType: "system",
      action: "INVITE_OPENED",
      entityType: "invite",
      entityId: inv.id,
      after: { token },
    });
  }

  // Check expiry
  if (new Date() > inv.expiresAt) return { state: "expired" };

  // Find related duel (invite.createdByUserId created the duel)
  const d = await db.query.duel.findFirst({
    where: eq(duel.createdByUserId, inv.createdByUserId),
  });

  if (!d || !["open", "closed"].includes(d.status)) {
    return { state: "expired" };
  }

  if (new Date() > d.closeAt) return { state: "expired" };

  // Get market
  const m = await db.query.market.findFirst({
    where: eq(market.id, d.marketId),
  });

  if (!m || m.status !== "active") return { state: "expired" };

  return {
    state: "landing",
    marketTitle: m.title,
    optionA: m.optionALabel,
    optionB: m.optionBLabel,
    minStake: m.minStake,
    feeBps: m.feeBps,
    closeAt: d.closeAt.toISOString(),
    duelStatus: d.status,
    totalStakeA: d.totalStakeA,
    totalStakeB: d.totalStakeB,
    participantCount: d.participantCount,
    duelToken: d.inviteToken,
  };
}
