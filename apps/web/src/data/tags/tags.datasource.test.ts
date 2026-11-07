import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTag, deleteTag, listTags } from './tags.datasource';

const TAG = { id: 't_1', name: 'Dragão' };

function mockFetchOnce(body: unknown) {
  const response = { ok: true, status: 200, json: async () => body } as Response;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listTags', () => {
  it('requests /tags and returns the parsed tags', async () => {
    mockFetchOnce([TAG]);

    await expect(listTags()).resolves.toEqual([TAG]);
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/tags$/), expect.anything());
  });

  it('throws when the response does not match the Tag schema', async () => {
    mockFetchOnce([{ id: 1, name: 'Dragão' }]);

    await expect(listTags()).rejects.toThrow();
  });
});

describe('createTag', () => {
  it('POSTs the name as JSON and returns the parsed tag', async () => {
    mockFetchOnce(TAG);

    const result = await createTag('Dragão');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/tags$/),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Dragão' }) }),
    );
    expect(result).toEqual(TAG);
  });
});

describe('deleteTag', () => {
  it('DELETEs the tag and returns the parsed tag', async () => {
    mockFetchOnce(TAG);

    const result = await deleteTag('t_1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/tags\/t_1$/),
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(result).toEqual(TAG);
  });
});
