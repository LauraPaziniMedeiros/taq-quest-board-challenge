import { date, integer, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { pgTable } from './_table.js';

export const QuestConstraints = {
  uniqueExternalId: 'quest_external_id_unique',
} as const;

export const questTable = pgTable('quest', {
  id: text('external_id').notNull().unique(QuestConstraints.uniqueExternalId),
  internalId: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  title: varchar().notNull(),
  description: varchar().notNull(),
  status: varchar().notNull().default('open'),
  difficulty: varchar().notNull().default('normal'),
  dueDate: date('due_date'),
  createdAt: timestamp({ withTimezone: true, precision: 6 }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, precision: 6 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp({ withTimezone: true, precision: 6 }),
});

export type QuestEntity = typeof questTable.$inferSelect;
