import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { clearDatabase, TagsSeed } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Tag } from '#domain/model/tags.model.js';
import { RequestMaker } from '#test/request-maker.test.js';

describe('GET /tags', () => {
  const endpoint = `${API_PREFIX}/tags`;
  let requestMaker: RequestMaker<Tag[]>;

  beforeEach(() => {
    requestMaker = new RequestMaker();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('should return an empty catalog', async () => {
    const response = await requestMaker.get({ endpoint });

    expect(response.data).toEqual([]);
  });

  it('should list tags ordered by their normalized name', async () => {
    await TagsSeed.insert({ name: 'Zebra', normalizedName: 'zebra' });
    await TagsSeed.insert({ name: 'alfa', normalizedName: 'alfa' });
    await TagsSeed.insert({ name: 'Beta', normalizedName: 'beta' });

    const response = await requestMaker.get({ endpoint });

    expect(response.data.map(tag => tag.name)).toEqual(['alfa', 'Beta', 'Zebra']);
  });

  it('should return the public tag shape only', async () => {
    const tag = await TagsSeed.insert({ name: 'Urgente', normalizedName: 'urgente' });

    const response = await requestMaker.get({ endpoint });

    expect(response.data).toEqual([{ id: tag.id, name: 'Urgente' }]);
  });
});
