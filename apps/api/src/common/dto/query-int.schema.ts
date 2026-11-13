import { z } from 'zod';

export function queryIntSchema(min: number, max: number) {
  return z
    .string()
    .regex(/^\d{1,16}$/, 'must be a non-negative integer')
    .transform(Number)
    .pipe(z.int().min(min).max(max));
}
