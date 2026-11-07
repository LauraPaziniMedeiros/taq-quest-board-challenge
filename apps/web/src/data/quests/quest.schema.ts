import { tagSchema } from '@data/tags/tag.schema';
import { QUEST_DIFFICULTIES, type Paginated, type PageInfo, type Quest } from '@domain/model/quest.model';
import { type ZodType, z } from 'zod';

export const questStatusSchema = z.enum(['open', 'in_progress', 'resolved']);
export const questDifficultySchema = z.enum(QUEST_DIFFICULTIES);

export const questSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: questStatusSchema,
  difficulty: questDifficultySchema,
  xpReward: z.number(),
  dueDate: z.iso.date().nullable(),
  tags: z.array(tagSchema),
  createdAt: z.string(),
}) satisfies ZodType<Quest>;

const pageInfoSchema = z.object({
  limit: z.number(),
  offset: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
}) satisfies ZodType<PageInfo>;

export const paginatedQuestSchema = z.object({
  nodes: z.array(questSchema),
  count: z.number(),
  pageInfo: pageInfoSchema,
}) satisfies ZodType<Paginated<Quest>>;
