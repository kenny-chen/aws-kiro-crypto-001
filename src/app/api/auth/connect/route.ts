import { generateChallenge } from "@/lib/crypto";
import { ok, genRequestId } from "@/lib/api";

export async function POST() {
  const requestId = genRequestId();
  const challenge = generateChallenge();
  return ok({ challenge }, requestId);
}
