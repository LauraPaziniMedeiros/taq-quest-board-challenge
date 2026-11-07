import { defineRelations } from 'drizzle-orm';
import * as questsSchema from './quests.entity.js';
import * as tagsSchema from './tags.entity.js';

export const relations = defineRelations({ ...questsSchema, ...tagsSchema }, r => ({
  questTable: {
    tags: r.many.tagTable({
      from: r.questTable.internalId.through(r.questTagTable.questInternalId),
      to: r.tagTable.internalId.through(r.questTagTable.tagInternalId),
    }),
  },
  tagTable: {
    quests: r.many.questTable({
      from: r.tagTable.internalId.through(r.questTagTable.tagInternalId),
      to: r.questTable.internalId.through(r.questTagTable.questInternalId),
    }),
  },
}));
