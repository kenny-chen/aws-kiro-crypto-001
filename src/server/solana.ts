import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { createTransferInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { db } from "@/db/client";
import { chainTx } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

let _connection: Connection | null = null;
function getConnection(): Connection {
  if (!_connection) _connection = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
  return _connection;
}

function getPlatformKeypair(): Keypair {
  const key = process.env.PLATFORM_PRIVATE_KEY!;
  return Keypair.fromSecretKey(Buffer.from(key, "base64"));
}

const USDC_MINT = () => new PublicKey(process.env.SOLANA_USDC_MINT!);
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;

export async function sendUsdcTransfer(params: {
  chainTxId: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
}): Promise<{ signature: string } | { error: string }> {
  // Idempotency: check if already confirmed
  const existing = await db.query.chainTx.findFirst({ where: eq(chainTx.id, params.chainTxId) });
  if (!existing) return { error: "chain_tx not found" };
  if (existing.status === "confirmed") return { signature: existing.signature! };

  const connection = getConnection();
  const payer = getPlatformKeypair();
  const mint = USDC_MINT();

  try {
    const fromAta = await getAssociatedTokenAddress(mint, new PublicKey(params.fromAddress));
    const toAta = await getAssociatedTokenAddress(mint, new PublicKey(params.toAddress));
    const amountLamports = Math.round(params.amount * 1_000_000); // USDC has 6 decimals

    const tx = new Transaction().add(
      createTransferInstruction(fromAta, toAta, payer.publicKey, amountLamports)
    );

    const signature = await connection.sendTransaction(tx, [payer]);

    await db.update(chainTx).set({ signature, status: "submitted" }).where(eq(chainTx.id, params.chainTxId));

    logger.info("USDC transfer submitted", { chainTxId: params.chainTxId, signature });
    return { signature };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown error";
    await db.update(chainTx).set({ status: "failed", failedAt: new Date(), error }).where(eq(chainTx.id, params.chainTxId));
    logger.error("USDC transfer failed", { chainTxId: params.chainTxId, error });
    return { error };
  }
}

export async function confirmTransaction(chainTxId: string): Promise<"confirmed" | "failed" | "pending"> {
  const record = await db.query.chainTx.findFirst({ where: eq(chainTx.id, chainTxId) });
  if (!record || !record.signature) return "pending";
  if (record.status === "confirmed") return "confirmed";
  if (record.status === "failed") return "failed";

  const connection = getConnection();
  try {
    const result = await connection.getSignatureStatus(record.signature);
    if (result?.value?.confirmationStatus === "confirmed" || result?.value?.confirmationStatus === "finalized") {
      await db.update(chainTx).set({ status: "confirmed", confirmedAt: new Date() }).where(eq(chainTx.id, chainTxId));
      return "confirmed";
    }
    if (result?.value?.err) {
      await db.update(chainTx).set({ status: "failed", failedAt: new Date(), error: JSON.stringify(result.value.err) }).where(eq(chainTx.id, chainTxId));
      return "failed";
    }
    return "pending";
  } catch {
    return "pending";
  }
}

export async function retryWithBackoff(fn: () => Promise<boolean>, maxRetries = MAX_RETRIES): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    const success = await fn();
    if (success) return true;
    await new Promise((r) => setTimeout(r, RETRY_BASE_MS * Math.pow(2, i)));
  }
  return false;
}
