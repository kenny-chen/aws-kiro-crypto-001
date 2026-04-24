import { randomUUID } from "crypto";

export type ApiOk<T> = { ok: true; data: T; requestId: string };
export type ApiErr = { ok: false; error: string; code: string; requestId: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;

export function genRequestId(): string {
  return randomUUID();
}

export function ok<T>(data: T, requestId: string): Response {
  return Response.json({ ok: true, data, requestId } satisfies ApiOk<T>);
}

export function err(code: string, error: string, requestId: string, status = 400): Response {
  return Response.json({ ok: false, error, code, requestId } satisfies ApiErr, { status });
}

// Standard error codes
export const ERR = {
  VALIDATION: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL: "INTERNAL_ERROR",
  CHAIN_FAILED: "CHAIN_TX_FAILED",
  EXPIRED: "EXPIRED",
} as const;
