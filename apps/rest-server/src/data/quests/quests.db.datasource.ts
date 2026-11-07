import { UnprocessableEntityError } from '@repo/core/error';
import type { PageInput, Paginated } from '@repo/core/pagination';
import { buildPageInfo } from '@repo/core/pagination';
import { DatabaseIdGenerator, dbClient, type QuestEntity, questTable, questTagTable, type TagEntity } from '@repo/db';
import { and, count, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { TagsDbDatasource } from '#data/tags/tags.db.datasource.js';
import {
  QUEST_DIFFICULTIES,
  QUEST_STATUSES,
  type QuestData,
  type QuestInput,
  type QuestStatus,
  type QuestUpdateInput,
} from '#domain/model/quests.model.js';
import { QuestErrors } from '#domain/quests/quests.error.js';

const EXTERNAL_ID_PREFIX = 'q_';

// The columns are plain varchar, so values are checked here instead of trusting a cast.
const StatusColumn = z.enum(QUEST_STATUSES);
const DifficultyColumn = z.enum(QUEST_DIFFICULTIES);

export const QuestsDbDatasource = {
  async create(input: QuestInput): Promise<QuestData> {
    const { tagIds, ...questInput } = input;
    const id = DatabaseIdGenerator.generate(EXTERNAL_ID_PREFIX);
    const createdAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const tags = await resolveTags(tagIds);

    const quest = await dbClient.transaction(async tx => {
      const [created] = await tx
        .insert(questTable)
        .values({ ...questInput, dueDate: questInput.dueDate ?? null, id, createdAt })
        .returning();

      if (tags.length) {
        await tx.insert(questTagTable).values(
          tags.map(tag => ({
            questInternalId: created!.internalId,
            tagInternalId: tag.internalId,
          })),
        );
      }

      return created!;
    });

    return toQuestData({ ...quest, tags });
  },

  async findOneById(id: string): Promise<QuestData | null> {
    const quest = await dbClient.query.questTable.findFirst({
      where: { id, deletedAt: { isNull: true } },
      with: { tags: true },
    });
    return quest ? toQuestData(quest) : null;
  },

  async update(id: string, input: QuestUpdateInput): Promise<QuestData | null> {
    if (Object.keys(input).length === 0) {
      return this.findOneById(id);
    }

    const { tagIds, ...questFields } = input;
    const tags = tagIds === undefined ? undefined : await resolveTags(tagIds);

    const updated = await dbClient.transaction(async tx => {
      const [existing] = await tx
        .select()
        .from(questTable)
        .where(and(eq(questTable.id, id), isNull(questTable.deletedAt)));

      if (!existing) {
        return null;
      }

      let updatedQuest: QuestEntity | null = existing;

      if (Object.keys(questFields).length > 0 || tagIds !== undefined) {
        const [row] = await tx
          .update(questTable)
          .set({ ...questFields, updatedAt: new Date() })
          .where(eq(questTable.internalId, existing.internalId))
          .returning();
        updatedQuest = row ?? null;
      }

      if (tagIds !== undefined) {
        await tx.delete(questTagTable).where(eq(questTagTable.questInternalId, existing.internalId));

        if (tags!.length) {
          await tx.insert(questTagTable).values(
            tags!.map(tag => ({
              questInternalId: existing.internalId,
              tagInternalId: tag.internalId,
            })),
          );
        }
      }

      return updatedQuest;
    });

    if (!updated) {
      return null;
    }

    return tags === undefined ? this.findOneById(id) : toQuestData({ ...updated, tags });
  },

  async delete(id: string): Promise<QuestData | null> {
    const existing = await this.findOneById(id);
    if (!existing) {
      return null;
    }

    const [quest] = await dbClient
      .update(questTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(questTable.id, id), isNull(questTable.deletedAt)))
      .returning();

    return quest ? existing : null;
  },

  async findMany(status: QuestStatus | undefined, page: PageInput): Promise<Paginated<QuestData>> {
    const offset = page.offset ?? 0;

    const [nodes, totalItems] = await Promise.all([
      dbClient.query.questTable.findMany({
        where: status ? { status, deletedAt: { isNull: true } } : { deletedAt: { isNull: true } },
        orderBy: { createdAt: 'desc' },
        limit: page.limit,
        offset,
        with: { tags: true },
      }),
      countActiveQuests(status),
    ]);

    return { nodes: nodes.map(toQuestData), count: totalItems, pageInfo: buildPageInfo(page, totalItems) };
  },
};

async function resolveTags(tagIds: string[] | undefined): Promise<TagEntity[]> {
  if (tagIds === undefined) {
    return [];
  }

  const uniqueIds = [...new Set(tagIds)];
  const tags = await TagsDbDatasource.findByIds(uniqueIds);

  if (tags.length !== uniqueIds.length) {
    throw new UnprocessableEntityError(QuestErrors.InvalidTags);
  }

  return tags;
}

function toQuestData(entity: QuestEntity & { tags?: TagEntity[] }): QuestData {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    status: StatusColumn.parse(entity.status),
    difficulty: DifficultyColumn.parse(entity.difficulty),
    dueDate: entity.dueDate,
    tags: (entity.tags ?? [])
      .map(tag => ({ id: tag.id, name: tag.name }))
      .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR')),
    createdAt: entity.createdAt,
  };
}

async function countActiveQuests(status?: QuestStatus): Promise<number> {
  const activeFilter = isNull(questTable.deletedAt);
  const where = status ? and(activeFilter, eq(questTable.status, status)) : activeFilter;

  const [row] = await dbClient.select({ value: count() }).from(questTable).where(where);
  return row!.value;
}
