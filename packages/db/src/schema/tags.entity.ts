import { index, integer, primaryKey, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { pgTable } from './_table.js';
import { questTable } from './quests.entity.js';

export const TagConstraints = {
  uniqueExternalId: 'tag_external_id_unique',
  uniqueNormalizedName: 'tag_normalized_name_unique',
} as const;

export const tagTable = pgTable('tag', {
  id: text('external_id').notNull().unique(TagConstraints.uniqueExternalId),
  internalId: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  name: varchar().notNull(),
  normalizedName: varchar('normalized_name').notNull().unique(TagConstraints.uniqueNormalizedName),
  createdAt: timestamp({ withTimezone: true, precision: 6 }).notNull().defaultNow(),
});

export const questTagTable = pgTable(
  'quest_tag',
  {
    questInternalId: integer('quest_internal_id')
      .notNull()
      .references(() => questTable.internalId, { onDelete: 'cascade' }),
    tagInternalId: integer('tag_internal_id')
      .notNull()
      .references(() => tagTable.internalId, { onDelete: 'cascade' }),
  },
  table => [
    primaryKey({ columns: [table.questInternalId, table.tagInternalId] }),
    index('quest_tag_tag_internal_id_index').on(table.tagInternalId),
  ],
);

export type TagEntity = typeof tagTable.$inferSelect;
export type QuestTagEntity = typeof questTagTable.$inferSelect;
