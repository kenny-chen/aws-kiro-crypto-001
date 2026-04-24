import { getReconcileStats } from "@/server/worker";
import { ok, genRequestId } from "@/lib/api";

export async function GET() {
  const requestId = genRequestId();
  const stats = await getReconcileStats();
  return ok(stats, requestId);
}
