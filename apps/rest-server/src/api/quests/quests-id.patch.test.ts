import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { dbClient } from '@repo/db';
import { clearDatabase, QuestsSeed } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Quest, QuestUpdateInput } from '#domain/model/quests.model.js';
import { QuestErrors } from '#domain/quests/quests.error.js';
import { checkErrors } from '#test/checkers/checker.test.js';
import { checkQuest } from '#test/checkers/quests.checker.test.js';
import { RequestMaker } from '#test/request-maker.test.js';

describe('PATCH /quests/:id', () => {
  const invalidDataMessage = 'Os dados enviados são inválidos. Por favor, reveja as informações.';

  let requestMaker: RequestMaker<Quest, QuestUpdateInput>;

  beforeEach(() => {
    requestMaker = new RequestMaker();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('should update the title', async () => {
    const questDb = await QuestsSeed.insert();
    const body = { title: 'Título atualizado' };

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body,
    });

    const updatedDb = (await dbClient.query.questTable.findFirst({ where: { id: questDb.id } }))!;
    expect(updatedDb.title).toBe(body.title);
    checkQuest(response.data, updatedDb);
  });

  it('should update the description', async () => {
    const questDb = await QuestsSeed.insert();
    const body = { description: 'Descrição atualizada' };

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body,
    });

    const updatedDb = (await dbClient.query.questTable.findFirst({ where: { id: questDb.id } }))!;
    expect(updatedDb.description).toBe(body.description);
    checkQuest(response.data, updatedDb);
  });

  it('should update the difficulty and returned XP', async () => {
    const questDb = await QuestsSeed.insert({ difficulty: 'normal' });
    const body = { difficulty: 'high' as const };

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body,
    });

    const updatedDb = (await dbClient.query.questTable.findFirst({ where: { id: questDb.id } }))!;
    expect(updatedDb.difficulty).toBe('high');
    expect(response.data.xpReward).toBe(50);
    checkQuest(response.data, updatedDb);
  });

  it('should update the status', async () => {
    const questDb = await QuestsSeed.insert({ status: 'open' });
    const body = { status: 'in_progress' as const };

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body,
    });

    const updatedDb = (await dbClient.query.questTable.findFirst({ where: { id: questDb.id } }))!;
    expect(updatedDb.status).toBe('in_progress');
    checkQuest(response.data, updatedDb);
  });

  it('should update the due date', async () => {
    const questDb = await QuestsSeed.insert({ dueDate: null });
    const body = { dueDate: '2026-12-31' };

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body,
    });

    const updatedDb = (await dbClient.query.questTable.findFirst({ where: { id: questDb.id } }))!;
    expect(updatedDb.dueDate).toBe(body.dueDate);
    expect(response.data.dueDate).toBe(body.dueDate);
    checkQuest(response.data, updatedDb);
  });

  it('should clear the due date when null is sent', async () => {
    const questDb = await QuestsSeed.insert({ dueDate: '2026-12-31' });

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body: { dueDate: null },
    });

    const updatedDb = (await dbClient.query.questTable.findFirst({ where: { id: questDb.id } }))!;
    expect(updatedDb.dueDate).toBeNull();
    expect(response.data.dueDate).toBeNull();
    checkQuest(response.data, updatedDb);
  });

  it('should keep the due date when it is omitted', async () => {
    const questDb = await QuestsSeed.insert({ dueDate: '2026-12-31' });

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body: { title: 'Updated title' },
    });

    const updatedDb = (await dbClient.query.questTable.findFirst({ where: { id: questDb.id } }))!;
    expect(updatedDb.dueDate).toBe('2026-12-31');
    expect(response.data.dueDate).toBe('2026-12-31');
    checkQuest(response.data, updatedDb);
  });

  it('should give a validation error if the due date is invalid', async () => {
    const questDb = await QuestsSeed.insert();

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body: { dueDate: '31/12/2026' } as any,
      expectedStatus: 422,
    });

    checkErrors(response, [{ code: 'VAL_01', message: invalidDataMessage }]);
  });

  it('should update several fields at once', async () => {
    const questDb = await QuestsSeed.insert();
    const body = { title: 'Novo título', description: 'Nova descrição', difficulty: 'easy' as const };

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body,
    });

    const updatedDb = (await dbClient.query.questTable.findFirst({ where: { id: questDb.id } }))!;
    expect(updatedDb.title).toBe(body.title);
    expect(updatedDb.description).toBe(body.description);
    expect(updatedDb.difficulty).toBe('easy');
    expect(response.data.xpReward).toBe(10);
    checkQuest(response.data, updatedDb);
  });

  it('should leave the quest unchanged when the body is empty', async () => {
    const questDb = await QuestsSeed.insert({ title: 'Original', difficulty: 'high' });

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body: {},
    });

    const updatedDb = (await dbClient.query.questTable.findFirst({ where: { id: questDb.id } }))!;
    expect(updatedDb.title).toBe('Original');
    expect(updatedDb.difficulty).toBe('high');
    checkQuest(response.data, updatedDb);
  });

  it('should give a 404 error if the quest does not exist', async () => {
    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/q_missing`,
      body: { title: 'Updated' },
      expectedStatus: 404,
    });

    checkErrors(response, [QuestErrors.NotFound]);
  });

  it('should give a 404 error if the quest is deleted', async () => {
    const questDb = await QuestsSeed.insert({ deletedAt: new Date() });

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body: { title: 'Updated' },
      expectedStatus: 404,
    });

    checkErrors(response, [QuestErrors.NotFound]);
  });

  it('should give a validation error if the id is not a quest id', async () => {
    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/not-a-quest`,
      body: { title: 'Updated' },
      expectedStatus: 422,
    });

    checkErrors(response, [{ code: 'VAL_01', message: invalidDataMessage }]);
  });

  it('should give a validation error if the title is empty', async () => {
    const questDb = await QuestsSeed.insert();

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body: { title: '   ' },
      expectedStatus: 422,
    });

    checkErrors(response, [
      {
        code: 'VAL_01',
        message: invalidDataMessage,
        details: [{ message: 'Muito pequeno: esperado que string tivesse >=1 caracteres' }],
      },
    ]);
  });

  it('should give a validation error if the difficulty is invalid', async () => {
    const questDb = await QuestsSeed.insert();

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body: { difficulty: 'legendary' } as any,
      expectedStatus: 422,
    });

    checkErrors(response, [{ code: 'VAL_01', message: invalidDataMessage }]);
  });

  it('should give a validation error if the status is invalid', async () => {
    const questDb = await QuestsSeed.insert();

    const response = await requestMaker.patch({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      body: { status: 'archived' } as any,
      expectedStatus: 422,
    });

    checkErrors(response, [{ code: 'VAL_01', message: invalidDataMessage }]);
  });
});
