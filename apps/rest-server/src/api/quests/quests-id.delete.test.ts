import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { Paginated } from '@repo/core/pagination';
import { dbClient } from '@repo/db';
import { clearDatabase, QuestTagsSeed, QuestsSeed, TagsSeed } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Quest } from '#domain/model/quests.model.js';
import { QuestErrors } from '#domain/quests/quests.error.js';
import { checkErrors } from '#test/checkers/checker.test.js';
import { checkQuest } from '#test/checkers/quests.checker.test.js';
import { RequestMaker } from '#test/request-maker.test.js';

describe('DELETE /quests/:id', () => {
  let requestMaker: RequestMaker<Quest>;

  beforeEach(() => {
    requestMaker = new RequestMaker();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('should remove a quest and return it', async () => {
    const questDb = await QuestsSeed.insert({ status: 'resolved', difficulty: 'high' });

    const response = await requestMaker.delete({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
    });

    expect(response.status).toBe(200);
    const deletedDb = (await dbClient.query.questTable.findFirst({ where: { id: questDb.id } }))!;
    expect(deletedDb.deletedAt).not.toBeNull();
    checkQuest(response.data, deletedDb);
    expect(response.data.xpReward).toBe(50);
  });

  it('should return the quest tags when removing a quest', async () => {
    const questDb = await QuestsSeed.insert();
    const tag = await TagsSeed.insert({ name: 'Urgente', normalizedName: 'urgente' });
    await QuestTagsSeed.attach(questDb, [tag]);

    const response = await requestMaker.delete({ endpoint: `${API_PREFIX}/quests/${questDb.id}` });

    checkQuest(response.data, questDb, [tag]);
  });

  it('should make the quest unavailable afterwards', async () => {
    const questDb = await QuestsSeed.insert();

    await requestMaker.delete({ endpoint: `${API_PREFIX}/quests/${questDb.id}` });

    const getResponse = await requestMaker.get({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      expectedStatus: 404,
    });
    checkErrors(getResponse, [QuestErrors.NotFound]);
  });

  it('should exclude the quest from the list', async () => {
    const questDb = await QuestsSeed.insert();
    await QuestsSeed.insert();

    await requestMaker.delete({ endpoint: `${API_PREFIX}/quests/${questDb.id}` });

    const listRequestMaker = new RequestMaker<Paginated<Quest>>();
    const response = await listRequestMaker.get({ endpoint: `${API_PREFIX}/quests` });
    expect(response.data.nodes.map((quest: Quest) => quest.id)).not.toContain(questDb.id);
    expect(response.data.count).toBe(1);
  });

  it('should give a 404 error if the quest does not exist', async () => {
    const response = await requestMaker.delete({
      endpoint: `${API_PREFIX}/quests/q_missing`,
      expectedStatus: 404,
    });

    checkErrors(response, [QuestErrors.NotFound]);
  });

  it('should give a 404 error if the quest is already removed', async () => {
    const questDb = await QuestsSeed.insert({ deletedAt: new Date() });

    const response = await requestMaker.delete({
      endpoint: `${API_PREFIX}/quests/${questDb.id}`,
      expectedStatus: 404,
    });

    checkErrors(response, [QuestErrors.NotFound]);
  });

  it('should give a validation error if the id is not a quest id', async () => {
    const response = await requestMaker.delete({
      endpoint: `${API_PREFIX}/quests/not-a-quest`,
      expectedStatus: 422,
    });

    checkErrors(response, [
      { code: 'VAL_01', message: 'Os dados enviados são inválidos. Por favor, reveja as informações.' },
    ]);
  });
});
