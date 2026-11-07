import { ApiError } from '@core/http/http-client';
import { createTag, deleteTag, listTags } from '@data/tags/tags.datasource';
import type { Tag } from '@domain/model/tag.model';
import { normalizeTagName, sortTags } from '@domain/tags/tags.utils';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTagsResult {
  tags: Tag[];
  isLoading: boolean;
  error: ApiError | null;
  isMutating: boolean;
  mutationError: ApiError | null;
  refetch: () => Promise<Tag[]>;
  createTag: (name: string) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<Tag | null>;
  addTagLocally: (tag: Tag) => void;
  removeTagLocally: (id: string) => void;
  clearMutationError: () => void;
}

export function useTags(): UseTagsResult {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<ApiError | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(async (): Promise<Tag[]> => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listTags(request.signal);
      if (!request.signal.aborted) {
        setTags(result);
        return result;
      }
      return [];
    } catch (err) {
      if (!request.signal.aborted) {
        setError(err instanceof ApiError ? err : new ApiError('Falha ao carregar as tags'));
      }
      return [];
    } finally {
      if (!request.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
    return () => requestRef.current?.abort();
  }, [load]);

  const addTagLocally = useCallback((tag: Tag) => {
    setTags(previous => sortTags([...previous.filter(item => item.id !== tag.id), tag]));
  }, []);

  const removeTagLocally = useCallback((id: string) => {
    setTags(previous => previous.filter(tag => tag.id !== id));
  }, []);

  const create = useCallback(
    async (name: string): Promise<Tag | null> => {
      setIsMutating(true);
      setMutationError(null);

      try {
        const created = await createTag(name);
        addTagLocally(created);
        return created;
      } catch (err) {
        const apiError = err instanceof ApiError ? err : new ApiError('Falha ao criar a tag');

        if (apiError.code === 'TAG_02') {
          const refreshed = await load();
          const existing = refreshed.find(tag => normalizeTagName(tag.name) === normalizeTagName(name));
          if (existing) {
            return existing;
          }
        }

        setMutationError(apiError);
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [addTagLocally, load],
  );

  const remove = useCallback(
    async (id: string): Promise<Tag | null> => {
      setIsMutating(true);
      setMutationError(null);

      try {
        const deleted = await deleteTag(id);
        removeTagLocally(id);
        return deleted;
      } catch (err) {
        setMutationError(err instanceof ApiError ? err : new ApiError('Falha ao excluir a tag'));
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [removeTagLocally],
  );

  return {
    tags,
    isLoading,
    error,
    isMutating,
    mutationError,
    refetch: load,
    createTag: create,
    deleteTag: remove,
    addTagLocally,
    removeTagLocally,
    clearMutationError: () => setMutationError(null),
  };
}
