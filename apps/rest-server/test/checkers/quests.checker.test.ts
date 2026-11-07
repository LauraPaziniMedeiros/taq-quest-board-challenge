import { expect } from 'bun:test';
import type { QuestEntity } from '@repo/db';
import type { Quest, QuestDifficulty, QuestStatus } from '#domain/model/quests.model.js';
import { calculateXpReward } from '#domain/quests/quests.utils.js';

export function checkQuests(data: Quest[], entities: QuestEntity[]): void {
  expect(data).toHaveLength(entities.length);
  data.forEach((quest, index) => checkQuest(quest, entities[index]!));
}

export function checkQuest(data: Quest, entity: QuestEntity): void {
  expect(normalizeCreatedAt(data)).toEqual(normalizeCreatedAt(mapQuestToCheck(entity)));
}

export function mapQuestToCheck(quest: QuestEntity): Quest {
  const difficulty = quest.difficulty as QuestDifficulty;

  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    status: quest.status as QuestStatus,
    difficulty,
    xpReward: calculateXpReward(difficulty),
    dueDate: quest.dueDate,
    createdAt: quest.createdAt,
  };
}

function normalizeCreatedAt(quest: Quest): Omit<Quest, 'createdAt'> & { createdAt: string } {
  return { ...quest, createdAt: new Date(quest.createdAt).toISOString() };
}
