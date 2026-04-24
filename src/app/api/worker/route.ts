import { closeDuels, processPayouts } from "@/server/worker";
import { ok, err, genRequestId, ERR } from "@/lib/api";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const requestId = genRequestId();

  // Simple auth via secret header
  const secret = req.headers.get("x-worker-secret");
  if (secret !== process.env.PLATFORM_PRIVATE_KEY) {
    return err(ERR.FORBIDDEN, "Unauthorized", requestId, 403);
  }

  try {
    await closeDuels();
    await processPayouts();
    logger.info("Worker cycle complete", { requestId });
    return ok({ status: "done" }, requestId);
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown";
    logger.error("Worker cycle failed", { requestId, error });
    return err(ERR.INTERNAL, error, requestId, 500);
  }
}
