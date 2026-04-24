import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SOLANA_RPC_URL: z.string().url(),
  SOLANA_USDC_MINT: z.string().min(1),
  PLATFORM_WALLET_ADDRESS: z.string().min(1),
  PLATFORM_PRIVATE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  ADMIN_WALLET_ADDRESSES: z.string().min(1),
});

export const env = envSchema.parse(process.env);
