import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import { ok, err, genRequestId, ERR } from "@/lib/api";

export async function GET() {
  const requestId = genRequestId();
  try {
    const result = await db.execute(sql`SELECT 1 as connected`);
    return ok({ database: "connected", timestamp: new Date().toISOString() }, requestId);
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown error";
    return err(ERR.INTERNAL, `Database connection failed: ${error}`, requestId, 500);
  }
}
