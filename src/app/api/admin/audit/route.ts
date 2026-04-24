import { db } from "@/db/client";
import { auditLog } from "@/db/schema";
import { ok, genRequestId } from "@/lib/api";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export async function GET(req: Request) {
  const requestId = genRequestId();
  const url = new URL(req.url);
  const entityTypeFilter = url.searchParams.get("entityType");
  const entityIdFilter = url.searchParams.get("entityId");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);

  const conditions = [];
  if (entityTypeFilter) conditions.push(eq(auditLog.entityType, entityTypeFilter as any));
  if (entityIdFilter) conditions.push(eq(auditLog.entityId, entityIdFilter));

  const logs = await db
    .select()
    .from(auditLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  return ok(logs, requestId);
}
