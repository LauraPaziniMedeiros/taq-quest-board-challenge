import { DatabaseIdGenerator } from '#root/database-id.utils.js';
import { dbClient } from '#root/database.client.js';
import { type QuestEntity, questTable } from '#root/schema/quests.entity.js';
import type { InputDb } from './seeds.entity.js';
import { generateRandomString } from './seeds.utils.js';

export const QuestsSeed = {
  fakeData(input: Partial<QuestEntity> = {}): InputDb<QuestEntity> {
    const random = generateRandomString();

    return {
      id: DatabaseIdGenerator.generate('q_'),
      title: `Quest ${random}`,
      description: `Description ${random}`,
      status: 'open',
      difficulty: 'normal',
      dueDate: null,
      ...input,
    };
  },

  async insert(input: Partial<QuestEntity> = {}): Promise<QuestEntity> {
    const [quest] = await dbClient.insert(questTable).values(QuestsSeed.fakeData(input)).returning();
    return quest!;
  },

  insertMany(input: Partial<QuestEntity>[] = []): Promise<QuestEntity[]> {
    const partials = input.length ? input : Array.from({ length: 5 }, () => ({}));
    return dbClient.insert(questTable).values(partials.map(QuestsSeed.fakeData)).returning();
  },
};
