import { db } from "@/db/client";
import { market } from "@/db/schema";
import { ok, genRequestId } from "@/lib/api";
import { desc } from "drizzle-orm";

export async function GET() {
  const requestId = genRequestId();
  const markets = await db.select().from(market).orderBy(desc(market.createdAt)).limit(100);
  return ok(markets, requestId);
}
