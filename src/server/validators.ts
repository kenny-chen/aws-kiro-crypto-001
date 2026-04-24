import { z } from "zod/v4";

export const createMarketSchema = z.object({
  title: z.string().min(3).max(200),
  optionALabel: z.string().min(1).max(100),
  optionBLabel: z.string().min(1).max(100),
  resolutionAt: z.iso.datetime(),
  minStake: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid USDC amount"),
  feeBps: z.number().int().min(0).max(5000), // 0-50%
  userId: z.string().uuid(),
});

export type CreateMarketInput = z.infer<typeof createMarketSchema>;
