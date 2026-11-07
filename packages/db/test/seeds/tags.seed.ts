import { DatabaseIdGenerator } from '#root/database-id.utils.js';
import { dbClient } from '#root/database.client.js';
import { type QuestEntity, questTable } from '#root/schema/quests.entity.js';
import { type QuestTagEntity, questTagTable, type TagEntity, tagTable } from '#root/schema/tags.entity.js';
import { generateRandomString } from './seeds.utils.js';

type TagSeedInput = Partial<Pick<TagEntity, 'id' | 'name' | 'normalizedName' | 'createdAt'>>;

export const TagsSeed = {
  fakeData(input: TagSeedInput = {}): Omit<TagEntity, 'internalId'> {
    const random = generateRandomString();
    const name = input.name ?? `Tag ${random}`;

    return {
      id: input.id ?? DatabaseIdGenerator.generate('t_'),
      name,
      normalizedName: input.normalizedName ?? name.trim().toLocaleLowerCase('pt-BR'),
      createdAt: input.createdAt ?? new Date(),
    };
  },

  async insert(input: TagSeedInput = {}): Promise<TagEntity> {
    const [tag] = await dbClient.insert(tagTable).values(TagsSeed.fakeData(input)).returning();
    return tag!;
  },

  insertMany(input: TagSeedInput[] = []): Promise<TagEntity[]> {
    const partials = input.length ? input : Array.from({ length: 3 }, () => ({}));
    return dbClient.insert(tagTable).values(partials.map(TagsSeed.fakeData)).returning();
  },
};

export const QuestTagsSeed = {
  async attach(quest: QuestEntity, tags: TagEntity[]): Promise<QuestTagEntity[]> {
    if (tags.length === 0) {
      return [];
    }

    return dbClient
      .insert(questTagTable)
      .values(tags.map(tag => ({ questInternalId: quest.internalId, tagInternalId: tag.internalId })))
      .returning();
  },
};

export async function createQuestWithTags(
  questInput: Partial<QuestEntity> = {},
  tagInputs: TagSeedInput[] = [],
): Promise<{ quest: QuestEntity; tags: TagEntity[] }> {
  const quest = await dbClient
    .insert(questTable)
    .values({
      id: DatabaseIdGenerator.generate('q_'),
      title: `Quest ${generateRandomString()}`,
      description: `Description ${generateRandomString()}`,
      ...questInput,
    })
    .returning()
    .then(([created]) => created!);
  const tags = tagInputs.length ? await TagsSeed.insertMany(tagInputs) : [];
  await QuestTagsSeed.attach(quest, tags);
  return { quest, tags };
}
