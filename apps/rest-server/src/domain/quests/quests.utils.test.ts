import { describe, expect, it } from 'bun:test';
import type { QuestData, QuestDifficulty } from '#domain/model/quests.model.js';
import { withXpReward } from './quests.utils.js';

describe('Unit - withXpReward', () => {
  const quest: QuestData = {
    id: 'q_1',
    title: 'Enfrentar o dragão',
    description: 'Derrote a besta',
    status: 'open',
    difficulty: 'normal',
    dueDate: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const cases: Array<[QuestDifficulty, number]> = [
    ['easy', 10],
    ['normal', 25],
    ['high', 50],
  ];

  it.each(cases)('should reward a %s quest with %d XP', (difficulty, xpReward) => {
    expect(withXpReward({ ...quest, difficulty })).toEqual({ ...quest, difficulty, xpReward });
  });
});
