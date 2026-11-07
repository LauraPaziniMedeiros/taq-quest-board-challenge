import { afterAll, afterEach, beforeAll, describe, expect, it, mock, spyOn } from 'bun:test';
import { DatabaseIdGenerator, dbClient } from '@repo/db';
import { clearDatabase } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Quest, QuestDifficulty, QuestInput } from '#domain/model/quests.model.js';
import { checkErrors } from '#test/checkers/checker.test.js';
import { checkQuest } from '#test/checkers/quests.checker.test.js';
import { ValidationError } from '#test/checkers/validation.error.test.js';
import { RequestMaker } from '#test/request-maker.test.js';

describe('POST /quests', () => {
  const endpoint = `${API_PREFIX}/quests`;
  const questId = 'q_123';
  const invalidDataMessage = 'Os dados enviados são inválidos. Por favor, reveja as informações.';

  let requestMaker: RequestMaker<Quest, Partial<QuestInput>>;

  beforeAll(() => {
    requestMaker = new RequestMaker();
    spyOn(DatabaseIdGenerator, 'generate').mockReturnValue(questId);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(() => {
    mock.restore();
  });

  it('should create quest successfully with the default difficulty', async () => {
    const body = { title: 'Login page is throwing 500', description: 'Users report a server error.' };
    const response = await requestMaker.post({ endpoint, body });

    const questDb = (await dbClient.query.questTable.findFirst({ where: { id: questId } }))!;
    checkQuest(response.data, questDb);
    expect(questDb).toEqual({
      id: questId,
      title: body.title,
      description: body.description,
      status: 'open',
      difficulty: 'normal',
      dueDate: null,
      internalId: expect.any(Number),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      deletedAt: null,
    });
    expect(response.data.dueDate).toBeNull();
  });

  it('should create a quest with a due date', async () => {
    const body = { title: 'Deliver the artifact', description: 'Before the festival.', dueDate: '2026-12-31' };
    const response = await requestMaker.post({ endpoint, body });

    const questDb = (await dbClient.query.questTable.findFirst({ where: { id: questId } }))!;
    checkQuest(response.data, questDb);
    expect(questDb.dueDate).toBe(body.dueDate);
    expect(response.data.dueDate).toBe(body.dueDate);
  });

  it('should accept a null due date', async () => {
    const body = { title: 'No deadline', description: 'Whenever.', dueDate: null };
    const response = await requestMaker.post({ endpoint, body });

    const questDb = (await dbClient.query.questTable.findFirst({ where: { id: questId } }))!;
    checkQuest(response.data, questDb);
    expect(questDb.dueDate).toBeNull();
    expect(response.data.dueDate).toBeNull();
  });

  it('should give a validation error if the due date is invalid', async () => {
    const body = { title: 'Bad date', description: 'desc', dueDate: '2026-13-40' } as any;
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [{ code: 'VAL_01', message: invalidDataMessage }]);
  });

  const validDifficulties: Array<[QuestDifficulty, number]> = [
    ['easy', 10],
    ['normal', 25],
    ['high', 50],
  ];

  it.each(validDifficulties)('should create a %s quest with %d XP', async (difficulty, xpReward) => {
    const body = { title: 'Urgent: production checkout is down', description: 'desc', difficulty };
    const response = await requestMaker.post({ endpoint, body });

    const questDb = (await dbClient.query.questTable.findFirst({ where: { id: questId } }))!;
    checkQuest(response.data, questDb);
    expect(questDb.difficulty).toBe(difficulty);
    expect(response.data.xpReward).toBe(xpReward);
  });

  it.each([
    ['an unknown value', 'legendary'],
    ['a number', 42],
    ['null', null],
  ])(
    'should default to normal when the difficulty is invalid and not one of: easy, normal, high',
    async (_label, difficulty) => {
      const body = { title: 'Invalid difficulty', description: 'desc', difficulty } as any;
      const response = await requestMaker.post({ endpoint, body });

      const questDb = (await dbClient.query.questTable.findFirst({ where: { id: questId } }))!;
      checkQuest(response.data, questDb);
      expect(questDb.difficulty).toBe('normal');
    },
  );

  it('should give an error if title is missing', async () => {
    const body = { description: 'desc' } as any;
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [
      { code: 'VAL_01', message: invalidDataMessage, details: [{ message: ValidationError.requiredString }] },
    ]);
  });

  it('should give an error if title is not a string', async () => {
    const body = { title: 12345, description: 'desc' } as any;
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [
      {
        code: 'VAL_01',
        message: invalidDataMessage,
        details: [{ message: ValidationError.invalidStringType }],
      },
    ]);
  });

  it('should give an error if description is missing', async () => {
    const body = { title: 'Missing description' } as any;
    const response = await requestMaker.post({ endpoint, body, expectedStatus: 422 });

    checkErrors(response, [
      { code: 'VAL_01', message: invalidDataMessage, details: [{ message: ValidationError.requiredString }] },
    ]);
  });
});
