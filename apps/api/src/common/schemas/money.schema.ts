import { z } from 'zod';

export const MAX_AMOUNT = 100_000_000;

export const amountSchema = z
  .int()
  .min(1)
  .max(MAX_AMOUNT)
  .describe('Amount in minor currency units, e.g. cents');
