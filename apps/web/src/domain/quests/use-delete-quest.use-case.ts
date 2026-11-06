import { ApiError } from '@core/http/http-client';
import { deleteQuest as deleteQuestRequest } from '@data/quests/quests.datasource';
import type { Quest } from '@domain/model/quest.model';
import { useState } from 'react';

interface UseDeleteQuestResult {
  deleteQuest: (id: string) => Promise<Quest | null>;
  isLoading: boolean;
  error: ApiError | null;
}

export function useDeleteQuest(): UseDeleteQuestResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = async (id: string): Promise<Quest | null> => {
    setIsLoading(true);
    setError(null);

    try {
      return await deleteQuestRequest(id);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('Falha ao remover a missão'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteQuest: submit, isLoading, error };
}
