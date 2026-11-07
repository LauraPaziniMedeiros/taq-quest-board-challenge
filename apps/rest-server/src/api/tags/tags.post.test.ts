import { afterAll, afterEach, beforeAll, describe, expect, it, mock, spyOn } from 'bun:test';
import { DatabaseIdGenerator, dbClient, tagTable } from '@repo/db';
import { clearDatabase, TagsSeed } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Tag, TagInput } from '#domain/model/tags.model.js';
import { TagErrors } from '#domain/tags/tags.error.js';
import { checkErrors } from '#test/checkers/checker.test.js';
import { RequestMaker } from '#test/request-maker.test.js';

describe('POST /tags', () => {
  const endpoint = `${API_PREFIX}/tags`;
  const tagId = 't_123';
  const invalidDataMessage = 'Os dados enviados são inválidos. Por favor, reveja as informações.';

  let requestMaker: RequestMaker<Tag, Partial<TagInput>>;

  beforeAll(() => {
    requestMaker = new RequestMaker();
    spyOn(DatabaseIdGenerator, 'generate').mockReturnValue(tagId);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(() => {
    mock.restore();
  });

  it('should create a tag preserving the user-entered spelling', async () => {
    const body = { name: '  Urgente  ' };
    const response = await requestMaker.post({ endpoint, body });

    const [tag] = await dbClient.select().from(tagTable);
    expect(response.data).toEqual({ id: tagId, name: 'Urgente' });
    expect(tag).toEqual({
      id: tagId,
      internalId: expect.any(Number),
      name: 'Urgente',
      normalizedName: 'urgente',
      createdAt: expect.any(Date),
    });
  });

  it('should reject a duplicate name ignoring case', async () => {
    await TagsSeed.insert({ name: 'Urgente', normalizedName: 'urgente' });

    const response = await requestMaker.post({ endpoint, body: { name: 'urgente' }, expectedStatus: 409 });

    checkErrors(response, [TagErrors.AlreadyExists]);
  });

  it('should reject a blank name', async () => {
    const response = await requestMaker.post({ endpoint, body: { name: '   ' }, expectedStatus: 422 });

    checkErrors(response, [{ code: 'VAL_01', message: invalidDataMessage }]);
  });

  it('should reject a name above the maximum length', async () => {
    const response = await requestMaker.post({ endpoint, body: { name: 'a'.repeat(31) }, expectedStatus: 422 });

    checkErrors(response, [{ code: 'VAL_01', message: invalidDataMessage }]);
  });
});
