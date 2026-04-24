import { z } from "zod/v4";
import { db } from "@/db/client";
import { market, auditLog } from "@/db/schema";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { eq } from "drizzle-orm";

const actionSchema = z.object({
  marketId: z.string().uuid(),
  action: z.enum(["freeze", "cancel", "restore"]),
  adminId: z.string().uuid(),
  note: z.string().max(500).optional(),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  freeze: ["active"],
  cancel: ["active", "frozen"],
  restore: ["frozen"],
};

export async function POST(req: Request) {
  const requestId = genRequestId();

  let body;
  try { body = actionSchema.parse(await req.json()); } catch { return err(ERR.VALIDATION, "Invalid request", requestId); }

  const m = await db.query.market.findFirst({ where: eq(market.id, body.marketId) });
  if (!m) return err(ERR.NOT_FOUND, "Market not found", requestId, 404);

  const allowed = VALID_TRANSITIONS[body.action];
  if (!allowed?.includes(m.status)) {
    return err(ERR.CONFLICT, `Cannot ${body.action} market in ${m.status} state`, requestId, 409);
  }

  const now = new Date();
  const newStatus = body.action === "freeze" ? "frozen" : body.action === "cancel" ? "cancelled" : "active";
  const updates: Record<string, unknown> = { status: newStatus, updatedAt: now };
  if (body.action === "freeze") updates.frozenAt = now;
  if (body.action === "cancel") updates.cancelledAt = now;
  if (body.action === "restore") { updates.frozenAt = null; }

  await db.update(market).set(updates).where(eq(market.id, body.marketId));

  await db.insert(auditLog).values({
    actorType: "admin",
    actorId: body.adminId,
    action: `MARKET_${body.action.toUpperCase()}`,
    entityType: "market",
    entityId: body.marketId,
    requestId,
    before: { status: m.status },
    after: { status: newStatus, note: body.note },
  });

  return ok({ marketId: body.marketId, status: newStatus }, requestId);
}
