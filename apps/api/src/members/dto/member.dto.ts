import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { groupParamSchema, idSchema } from '../../common/schemas/id.schema.js';
import { memberNameSchema, memberSchema } from '../../groups/dto/group.schemas.js';

export class CreateMemberDto extends createZodDto(z.strictObject({ name: memberNameSchema })) {}

export class MemberParamDto extends createZodDto(
  groupParamSchema.extend({ memberId: idSchema.describe('Member id') }),
) {}

export class MemberDto extends createZodDto(memberSchema) {}
