import { z } from 'zod';
import { queryIntSchema } from './query-int.schema.js';

export const pageQuerySchema = queryIntSchema(1, 100_000)
  .default(1)
  .describe('Page number, starting from 1');

export const limitQuerySchema = queryIntSchema(1, 100).default(20).describe('Page size, up to 100');

export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.int().min(0),
    page: z.int().min(1),
    limit: z.int().min(1),
  });
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
