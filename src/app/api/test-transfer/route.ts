import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { chainTx } from "@/db/schema";
import { sendBatchUsdcTransfer, confirmTransaction } from "@/server/solana";
import { generateToken } from "@/lib/token";

const transferSchema = z.object({
  recipients: z.array(z.object({
    toAddress: z.string().min(32),
    amount: z.number().positive().max(100),
  })).min(1).max(20),
});

// GET /api/test-transfer?id=<chainTxId> — check transfer status
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Test endpoint disabled in production" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id param" }, { status: 400 });

  const status = await confirmTransaction(id);
  return NextResponse.json({ chainTxId: id, status });
}

// POST /api/test-transfer — batch USDC transfer from platform wallet to multiple recipients
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Test endpoint disabled in production" }, { status: 403 });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid or empty JSON body" }, { status: 400 });
  }
  const parsed = transferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const fromAddress = process.env.PLATFORM_WALLET_ADDRESS!;
  const transfers: { chainTxId: string; toAddress: string; amount: number }[] = [];

  for (const r of parsed.data.recipients) {
    const [record] = await db.insert(chainTx).values({
      txType: "payout",
      idempotencyKey: `test-${generateToken(16)}`,
      fromAddress,
      toAddress: r.toAddress,
      amount: r.amount.toFixed(6),
      tokenMint: process.env.SOLANA_USDC_MINT!,
      relatedEntityType: "chain_tx",
      relatedEntityId: "00000000-0000-0000-0000-000000000000",
    }).returning();
    transfers.push({ chainTxId: record.id, toAddress: r.toAddress, amount: r.amount });
  }

  const result = await sendBatchUsdcTransfer({ transfers });

  return NextResponse.json({
    chainTxIds: transfers.map((t) => t.chainTxId),
    ...result,
  });
}
