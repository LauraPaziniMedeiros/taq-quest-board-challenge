import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { GENERIC_ERROR_MESSAGE } from '@repo/core/error';
import { clearDatabase, QuestTagsSeed, QuestsSeed, TagsSeed } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Quest } from '#domain/model/quests.model.js';
import { QuestErrors } from '#domain/quests/quests.error.js';
import { checkErrors } from '#test/checkers/checker.test.js';
import { checkQuest } from '#test/checkers/quests.checker.test.js';
import { RequestMaker } from '#test/request-maker.test.js';

describe('GET /quests/:id', () => {
  const invalidDataMessage = 'Os dados enviados são inválidos. Por favor, reveja as informações.';
  let requestMaker: RequestMaker<Quest>;

  beforeEach(() => {
    requestMaker = new RequestMaker();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('should return the quest successfully', async () => {
    const questDb = await QuestsSeed.insert();

    const response = await requestMaker.get({ endpoint: `${API_PREFIX}/quests/${questDb.id}` });

    checkQuest(response.data, questDb);
  });

  it('should include the quest tags', async () => {
    const questDb = await QuestsSeed.insert();
    const tag = await TagsSeed.insert({ name: 'Urgente', normalizedName: 'urgente' });
    await QuestTagsSeed.attach(questDb, [tag]);

    const response = await requestMaker.get({ endpoint: `${API_PREFIX}/quests/${questDb.id}` });

    checkQuest(response.data, questDb, [tag]);
    expect(response.data.tags).toEqual([{ id: tag.id, name: 'Urgente' }]);
  });

  it('should give a 404 error if the quest does not exist', async () => {
    const response = await requestMaker.get({ endpoint: `${API_PREFIX}/quests/q_missing`, expectedStatus: 404 });

    checkErrors(response, [QuestErrors.NotFound]);
  });

  it('should give a validation error if the id is not a quest id', async () => {
    const response = await requestMaker.get({ endpoint: `${API_PREFIX}/quests/not-a-quest`, expectedStatus: 422 });

    checkErrors(response, [{ code: 'VAL_01', message: invalidDataMessage }]);
  });

  it('should give a 500 error if the stored status is not a known quest status', async () => {
    const questDb = await QuestsSeed.insert({ status: 'archived' });

    const response = await requestMaker.get({ endpoint: `${API_PREFIX}/quests/${questDb.id}`, expectedStatus: 500 });

    checkErrors(response, [{ code: 'GLB_01', message: GENERIC_ERROR_MESSAGE }]);
  });
});
