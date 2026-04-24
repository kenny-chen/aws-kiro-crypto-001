import { randomBytes } from "crypto";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

export function generateChallenge(): string {
  return `Sign this message to verify wallet ownership: ${randomBytes(32).toString("hex")}`;
}

export function verifySignature(message: string, signature: Uint8Array, publicKey: string): boolean {
  try {
    const msgBytes = new TextEncoder().encode(message);
    const pubKey = new PublicKey(publicKey).toBytes();
    return nacl.sign.detached.verify(msgBytes, signature, pubKey);
  } catch {
    return false;
  }
}
