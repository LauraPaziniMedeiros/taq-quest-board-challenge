import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { dbClient, questTagTable } from '@repo/db';
import { clearDatabase, createQuestWithTags, QuestTagsSeed, TagsSeed } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Tag } from '#domain/model/tags.model.js';
import { TagErrors } from '#domain/tags/tags.error.js';
import { checkErrors } from '#test/checkers/checker.test.js';
import { RequestMaker } from '#test/request-maker.test.js';

describe('DELETE /tags/:id', () => {
  let requestMaker: RequestMaker<Tag>;

  beforeEach(() => {
    requestMaker = new RequestMaker();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('should delete the tag and its quest associations', async () => {
    const tag = await TagsSeed.insert({ name: 'Urgente', normalizedName: 'urgente' });
    const { quest } = await createQuestWithTags();
    await QuestTagsSeed.attach(quest, [tag]);

    const response = await requestMaker.delete({ endpoint: `${API_PREFIX}/tags/${tag.id}` });

    expect(response.data).toEqual({ id: tag.id, name: 'Urgente' });
    expect(await dbClient.select().from(questTagTable)).toEqual([]);
  });

  it('should remove the tag from every quest', async () => {
    const tag = await TagsSeed.insert({ name: 'Urgente', normalizedName: 'urgente' });
    const questOne = await createQuestWithTags();
    const questTwo = await createQuestWithTags();
    await QuestTagsSeed.attach(questOne.quest, [tag]);
    await QuestTagsSeed.attach(questTwo.quest, [tag]);

    await requestMaker.delete({ endpoint: `${API_PREFIX}/tags/${tag.id}` });

    expect(await dbClient.select().from(questTagTable)).toHaveLength(0);
  });

  it('should return 404 when the tag does not exist', async () => {
    const response = await requestMaker.delete({ endpoint: `${API_PREFIX}/tags/t_missing`, expectedStatus: 404 });

    checkErrors(response, [TagErrors.NotFound]);
  });

  it('should reject an invalid tag id', async () => {
    const response = await requestMaker.delete({ endpoint: `${API_PREFIX}/tags/not-a-tag`, expectedStatus: 422 });

    checkErrors(response, [
      { code: 'VAL_01', message: 'Os dados enviados são inválidos. Por favor, reveja as informações.' },
    ]);
  });
});
