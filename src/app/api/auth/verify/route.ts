import { z } from "zod/v4";
import { db } from "@/db/client";
import { userAccount, auditLog } from "@/db/schema";
import { verifySignature } from "@/lib/crypto";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { eq } from "drizzle-orm";

const verifySchema = z.object({
  walletAddress: z.string().min(32).max(44),
  signature: z.array(z.number()),
  message: z.string().min(1),
  invitedByUserId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const requestId = genRequestId();

  let body: z.infer<typeof verifySchema>;
  try {
    body = verifySchema.parse(await req.json());
  } catch {
    return err(ERR.VALIDATION, "Invalid request body", requestId);
  }

  const valid = verifySignature(body.message, new Uint8Array(body.signature), body.walletAddress);
  if (!valid) {
    return err(ERR.FORBIDDEN, "Signature verification failed", requestId, 403);
  }

  // Upsert user_account
  let user = await db.query.userAccount.findFirst({
    where: eq(userAccount.walletAddress, body.walletAddress),
  });

  if (!user) {
    const [created] = await db
      .insert(userAccount)
      .values({
        walletAddress: body.walletAddress,
        invitedByUserId: body.invitedByUserId,
      })
      .returning();
    user = created;

    await db.insert(auditLog).values({
      actorType: "user",
      actorId: user.id,
      action: "CREATE_OR_BIND",
      entityType: "user_account",
      entityId: user.id,
      requestId,
    });
  }

  await db.insert(auditLog).values({
    actorType: "user",
    actorId: user.id,
    action: "WALLET_CONNECTED",
    entityType: "user_account",
    entityId: user.id,
    requestId,
  });

  return ok({ userId: user.id, walletAddress: user.walletAddress, status: user.status }, requestId);
}
