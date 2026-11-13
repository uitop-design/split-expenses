import { createZodDto } from 'nestjs-zod';
import { groupParamSchema } from '../../common/schemas/id.schema.js';
import {
  createGroupSchema,
  groupDetailsSchema,
  groupSummarySchema,
  updateGroupSchema,
} from './group.schemas.js';

export class CreateGroupDto extends createZodDto(createGroupSchema) {}

export class UpdateGroupDto extends createZodDto(updateGroupSchema) {}

export class GroupParamDto extends createZodDto(groupParamSchema) {}

export class GroupDetailsDto extends createZodDto(groupDetailsSchema) {}

export class GroupSummaryDto extends createZodDto(groupSummarySchema) {}
