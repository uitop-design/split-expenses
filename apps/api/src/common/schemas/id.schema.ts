import { z } from 'zod';

export const idSchema = z.uuid();

export const groupParamSchema = z.object({ id: idSchema.describe('Group id') });

export function hasNoDuplicates(values: string[]): boolean {
  return new Set(values).size === values.length;
}
