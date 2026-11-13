import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class HealthDto extends createZodDto(
  z.object({ status: z.literal('ok'), checks: z.object({ postgres: z.literal('up') }) }),
) {}
