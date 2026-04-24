import { resolveInvite } from "@/server/invite";
import { ok, err, genRequestId, ERR } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const requestId = genRequestId();
  const { token } = await params;

  if (!token || token.length < 16) {
    return err(ERR.VALIDATION, "Invalid invite link", requestId, 400);
  }

  try {
    const data = await resolveInvite(token);
    return ok(data, requestId);
  } catch {
    return err(ERR.INTERNAL, "Failed to resolve invite", requestId, 500);
  }
}
