import { z } from "zod";

export const envSchema = z.object({
  PORT: z
    .string()
    .refine(
      (value) => !isNaN(parseFloat(value)),
      "Value must be a number-like string"
    ),
  MONGO_URI: z.string().url(),
  NODE_ENV: z.string().optional().default("development"),
});
