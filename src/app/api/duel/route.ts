import { z } from "zod/v4";
import { db } from "@/db/client";
import { duel, market, invite, auditLog, userAccount } from "@/db/schema";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { rateLimit, RATE } from "@/lib/rate-limit";
import { generateToken } from "@/lib/token";
import { isFuture } from "@/lib/time";
import { eq } from "drizzle-orm";

const createDuelSchema = z.object({
  marketId: z.string().uuid(),
  userId: z.string().uuid(),
  closeAt: z.iso.datetime(),
  side: z.enum(["A", "B"]),
  stakeAmount: z.string().regex(/^\d+(\.\d{1,6})?$/),
});

export async function POST(req: Request) {
  const requestId = genRequestId();

  let body;
  try {
    body = createDuelSchema.parse(await req.json());
  } catch {
    return err(ERR.VALIDATION, "Invalid duel data", requestId);
  }

  if (!rateLimit(`duel:${body.userId}`, RATE.CREATE_DUEL.max, RATE.CREATE_DUEL.windowMs)) {
    return err(ERR.RATE_LIMIT, "Too many requests", requestId, 429);
  }

  const user = await db.query.userAccount.findFirst({ where: eq(userAccount.id, body.userId) });
  if (!user || user.status !== "active") return err(ERR.FORBIDDEN, "User not active", requestId, 403);

  const m = await db.query.market.findFirst({ where: eq(market.id, body.marketId) });
  if (!m || m.status !== "active") return err(ERR.NOT_FOUND, "Market not available", requestId, 404);

  const closeAt = new Date(body.closeAt);
  if (!isFuture(closeAt)) return err(ERR.VALIDATION, "Close time must be in the future", requestId);
  if (closeAt > m.resolutionAt) return err(ERR.VALIDATION, "Close time cannot exceed resolution time", requestId);

  if (parseFloat(body.stakeAmount) < parseFloat(m.minStake)) {
    return err(ERR.VALIDATION, `Stake must be at least ${m.minStake} USDC`, requestId);
  }

  const inviteToken = generateToken();
  const inviteExpiresAt = closeAt;

  const [created] = await db
    .insert(duel)
    .values({
      marketId: body.marketId,
      createdByUserId: body.userId,
      visibility: "private",
      inviteToken,
      inviteExpiresAt,
      closeAt,
      status: "open",
    })
    .returning();

  // Create invite record for sharing
  await db.insert(invite).values({
    token: inviteToken,
    createdByUserId: body.userId,
    expiresAt: inviteExpiresAt,
  });

  await db.insert(auditLog).values({
    actorType: "user",
    actorId: body.userId,
    action: "DUEL_CREATE",
    entityType: "duel",
    entityId: created.id,
    requestId,
    after: { marketId: body.marketId, closeAt: body.closeAt },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return ok({
    ...created,
    inviteLink: `${appUrl}/duel/invite/${inviteToken}`,
  }, requestId);
}
