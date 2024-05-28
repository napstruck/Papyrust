import { ZodRawShape, z } from 'zod';

export const buildResponseZObjectType = (payloadZObjectType: ZodRawShape | null = null): any =>
  z.object({
    success: z.boolean(),
    payload: z
      .object(payloadZObjectType ?? {})
      .nullable()
      .default(null),
    message: z.string().nullable().default(null),
  });
