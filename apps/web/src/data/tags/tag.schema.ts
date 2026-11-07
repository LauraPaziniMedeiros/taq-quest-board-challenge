import type { Tag } from '@domain/model/tag.model';
import { type ZodType, z } from 'zod';

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
}) satisfies ZodType<Tag>;

export const tagsSchema = z.array(tagSchema) satisfies ZodType<Tag[]>;
