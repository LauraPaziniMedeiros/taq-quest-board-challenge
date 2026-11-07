import { expect } from 'bun:test';
import type { QuestEntity, TagEntity } from '@repo/db';
import type { Quest, QuestDifficulty, QuestStatus } from '#domain/model/quests.model.js';
import { calculateXpReward } from '#domain/quests/quests.utils.js';

export function checkQuests(data: Quest[], entities: QuestEntity[], tagsByEntity: TagEntity[][] = []): void {
  expect(data).toHaveLength(entities.length);
  data.forEach((quest, index) => checkQuest(quest, entities[index]!, tagsByEntity[index] ?? []));
}

export function checkQuest(data: Quest, entity: QuestEntity, tags: TagEntity[] = []): void {
  expect(normalizeCreatedAt(data)).toEqual(normalizeCreatedAt(mapQuestToCheck(entity, tags)));
}

export function mapQuestToCheck(quest: QuestEntity, tags: TagEntity[] = []): Quest {
  const difficulty = quest.difficulty as QuestDifficulty;

  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    status: quest.status as QuestStatus,
    difficulty,
    xpReward: calculateXpReward(difficulty),
    dueDate: quest.dueDate,
    tags: tags
      .map(tag => ({ id: tag.id, name: tag.name }))
      .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR')),
    createdAt: quest.createdAt,
  };
}

function normalizeCreatedAt(quest: Quest): Omit<Quest, 'createdAt'> & { createdAt: string } {
  return { ...quest, createdAt: new Date(quest.createdAt).toISOString() };
}
