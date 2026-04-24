import { db } from "@/db/client";
import { duel } from "@/db/schema";
import { ok, genRequestId } from "@/lib/api";
import { desc } from "drizzle-orm";

export async function GET() {
  const requestId = genRequestId();
  const duels = await db.select().from(duel).orderBy(desc(duel.createdAt)).limit(100);
  return ok(duels, requestId);
}
