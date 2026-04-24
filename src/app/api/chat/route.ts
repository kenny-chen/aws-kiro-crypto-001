import { z } from "zod/v4";
import { db } from "@/db/client";
import { chatMessage, auditLog } from "@/db/schema";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { rateLimit, RATE } from "@/lib/rate-limit";
import { eq, and, isNull, desc } from "drizzle-orm";

const sendSchema = z.object({
  duelId: z.string().uuid(),
  userId: z.string().uuid(),
  message: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  const requestId = genRequestId();

  let body;
  try {
    body = sendSchema.parse(await req.json());
  } catch {
    return err(ERR.VALIDATION, "Invalid message", requestId);
  }

  if (!rateLimit(`chat:${body.userId}`, RATE.SEND_CHAT.max, RATE.SEND_CHAT.windowMs)) {
    return err(ERR.RATE_LIMIT, "Slow down", requestId, 429);
  }

  const [msg] = await db.insert(chatMessage).values({
    duelId: body.duelId,
    userId: body.userId,
    message: body.message,
  }).returning();

  await db.insert(auditLog).values({
    actorType: "user",
    actorId: body.userId,
    action: "SEND_MESSAGE",
    entityType: "chat_message",
    entityId: msg.id,
    requestId,
  });

  return ok(msg, requestId);
}
