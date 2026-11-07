import { ApiError } from '@core/http/http-client';
import { createTag, deleteTag, listTags } from '@data/tags/tags.datasource';
import type { Tag } from '@domain/model/tag.model';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTags } from './use-tags.use-case';

vi.mock('@data/tags/tags.datasource', () => ({
  listTags: vi.fn(),
  createTag: vi.fn(),
  deleteTag: vi.fn(),
}));

const listTagsMock = vi.mocked(listTags);
const createTagMock = vi.mocked(createTag);
const deleteTagMock = vi.mocked(deleteTag);

const TAG = { id: 't_1', name: 'Dragão' };
const OTHER_TAG = { id: 't_2', name: 'Arqueiro' };

afterEach(() => {
  vi.resetAllMocks();
});

describe('useTags', () => {
  it('loads the tag catalog on mount', async () => {
    listTagsMock.mockResolvedValue([TAG]);

    const { result } = renderHook(() => useTags());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tags).toEqual([TAG]);
    expect(result.current.error).toBeNull();
  });

  it('sets the ApiError the datasource rejected with', async () => {
    listTagsMock.mockRejectedValue(new ApiError('deu ruim'));

    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('deu ruim');
  });

  it('wraps a non-ApiError rejection in a generic ApiError', async () => {
    listTagsMock.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('Falha ao carregar as tags');
  });

  it('creates a tag and adds it to the catalog', async () => {
    listTagsMock.mockResolvedValue([]);
    createTagMock.mockResolvedValue(TAG);

    const { result } = renderHook(() => useTags());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let created = null;
    await act(async () => {
      created = await result.current.createTag('Dragão');
    });

    expect(created).toEqual(TAG);
    expect(result.current.tags).toEqual([TAG]);
    expect(result.current.mutationError).toBeNull();
  });

  it('recovers an existing tag when the API reports a duplicate name', async () => {
    listTagsMock.mockResolvedValueOnce([]).mockResolvedValueOnce([TAG]);
    createTagMock.mockRejectedValue(new ApiError('Já existe', 'TAG_02'));

    const { result } = renderHook(() => useTags());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let created = null;
    await act(async () => {
      created = await result.current.createTag('  DRAGÃO  ');
    });

    expect(created).toEqual(TAG);
    expect(result.current.tags).toEqual([TAG]);
    expect(result.current.mutationError).toBeNull();
  });

  it('stores a mutation error when creating a tag fails', async () => {
    listTagsMock.mockResolvedValue([]);
    createTagMock.mockRejectedValue(new ApiError('falhou', 'TAG_01'));

    const { result } = renderHook(() => useTags());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let created: Tag | null = TAG;
    await act(async () => {
      created = await result.current.createTag('Dragão');
    });

    expect(created).toBeNull();
    expect(result.current.mutationError?.message).toBe('falhou');
  });

  it('deletes a tag and removes it from the catalog', async () => {
    listTagsMock.mockResolvedValue([TAG, OTHER_TAG]);
    deleteTagMock.mockResolvedValue(TAG);

    const { result } = renderHook(() => useTags());
    await waitFor(() => expect(result.current.tags).toHaveLength(2));

    let deleted = null;
    await act(async () => {
      deleted = await result.current.deleteTag(TAG.id);
    });

    expect(deleted).toEqual(TAG);
    expect(result.current.tags).toEqual([OTHER_TAG]);
  });

  it('stores a mutation error when deleting a tag fails', async () => {
    listTagsMock.mockResolvedValue([TAG]);
    deleteTagMock.mockRejectedValue(new ApiError('falhou'));

    const { result } = renderHook(() => useTags());
    await waitFor(() => expect(result.current.tags).toHaveLength(1));

    await act(async () => {
      await result.current.deleteTag(TAG.id);
    });

    expect(result.current.tags).toEqual([TAG]);
    expect(result.current.mutationError?.message).toBe('falhou');
  });

  it('adds and removes tags locally in sorted order', async () => {
    listTagsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useTags());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addTagLocally(TAG);
      result.current.addTagLocally(OTHER_TAG);
    });
    expect(result.current.tags.map(tag => tag.name)).toEqual(['Arqueiro', 'Dragão']);

    act(() => {
      result.current.removeTagLocally(TAG.id);
    });
    expect(result.current.tags).toEqual([OTHER_TAG]);
  });
});
