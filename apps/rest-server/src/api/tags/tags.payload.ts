import { type ZodType, z } from 'zod';
import type { Tag, TagInput } from '#domain/model/tags.model.js';
import { TAG_NAME_MAX_LENGTH } from '#domain/tags/tags.utils.js';

export const TagResponse = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .meta({ id: 'TagResponse' }) satisfies ZodType<Tag>;

export const TagRequest = z.object({
  name: z.string().trim().min(1).max(TAG_NAME_MAX_LENGTH),
}) satisfies ZodType<TagInput>;

export const TagParams = z.object({
  id: z.string().startsWith('t_'),
});

export const TagsResponse = z.array(TagResponse).meta({ id: 'TagsResponse' }) satisfies ZodType<Tag[]>;
