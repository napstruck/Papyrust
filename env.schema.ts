import { z } from "zod";

const verifyNumLikeString = [(value: any) => !isNaN(parseFloat(value)), 'Value must be a number-like string'] as const;

export const envSchema = z.object({
  PORT: z.string().refine(...verifyNumLikeString),
  MONGO_URI: z.string().url(),
  NODE_ENV: z.string().optional().default('development'),

  MESSAGE_FRAME_MAX_SIZE: z.string().refine(...verifyNumLikeString),
});