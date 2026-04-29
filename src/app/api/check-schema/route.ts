import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import { ok, err, genRequestId, ERR } from "@/lib/api";

export async function GET() {
  const requestId = genRequestId();
  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_account' AND column_name = 'avatar_url'
    `);

    if (result.length > 0) {
      return ok({ found: true, column: result[0] }, requestId);
    }
    return ok({ found: false, message: "avatar_url column not found" }, requestId);
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown error";
    return err(ERR.INTERNAL, `Schema check failed: ${error}`, requestId, 500);
  }
}
