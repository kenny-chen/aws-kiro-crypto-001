import { db } from "@/db/client";
import { chatMessage } from "@/db/schema";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { eq, isNull, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ duelId: string }> }
) {
  const requestId = genRequestId();
  const { duelId } = await params;

  const messages = await db
    .select()
    .from(chatMessage)
    .where(eq(chatMessage.duelId, duelId))
    .orderBy(asc(chatMessage.createdAt))
    .limit(200);

  const visible = messages.filter((m) => !m.deletedAt);

  return ok(visible, requestId);
}
