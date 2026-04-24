import { db } from "@/db/client";
import { market, auditLog, userAccount } from "@/db/schema";
import { createMarketSchema } from "@/server/validators";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { rateLimit, RATE } from "@/lib/rate-limit";
import { isFuture } from "@/lib/time";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const requestId = genRequestId();

  let body;
  try {
    body = createMarketSchema.parse(await req.json());
  } catch {
    return err(ERR.VALIDATION, "Invalid market data", requestId);
  }

  if (!rateLimit(`market:${body.userId}`, RATE.CREATE_MARKET.max, RATE.CREATE_MARKET.windowMs)) {
    return err(ERR.RATE_LIMIT, "Too many requests", requestId, 429);
  }

  // Validate user
  const user = await db.query.userAccount.findFirst({ where: eq(userAccount.id, body.userId) });
  if (!user || user.status !== "active") {
    return err(ERR.FORBIDDEN, "User not active", requestId, 403);
  }

  // Validate resolutionAt
  if (!isFuture(new Date(body.resolutionAt))) {
    return err(ERR.VALIDATION, "Resolution time must be in the future", requestId);
  }

  const [created] = await db
    .insert(market)
    .values({
      createdByUserId: body.userId,
      title: body.title,
      optionALabel: body.optionALabel,
      optionBLabel: body.optionBLabel,
      resolutionAt: new Date(body.resolutionAt),
      minStake: body.minStake,
      feeBps: body.feeBps,
      status: "active",
    })
    .returning();

  await db.insert(auditLog).values({
    actorType: "user",
    actorId: body.userId,
    action: "MARKET_CREATED",
    entityType: "market",
    entityId: created.id,
    requestId,
    after: { title: body.title, minStake: body.minStake, feeBps: body.feeBps },
  });

  return ok(created, requestId);
}
