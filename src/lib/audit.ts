import { db } from "@/db/client";
import { auditLog, type actorType, type entityType } from "@/db/schema";

type ActorType = (typeof actorType.enumValues)[number];
type EntityType = (typeof entityType.enumValues)[number];

export async function writeAudit(params: {
  actorType: ActorType;
  actorId?: string;
  action: string;
  entityType: EntityType;
  entityId: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  await db.insert(auditLog).values({
    actorType: params.actorType,
    actorId: params.actorId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    requestId: params.requestId,
    ip: params.ip,
    userAgent: params.userAgent,
    before: params.before ?? {},
    after: params.after ?? {},
  });
}
