import { ApiError } from '@core/http/http-client';
import { updateQuest as updateQuestRequest } from '@data/quests/quests.datasource';
import type { Quest, QuestUpdateInput } from '@domain/model/quest.model';
import { useState } from 'react';

interface UseUpdateQuestResult {
  updateQuest: (id: string, input: QuestUpdateInput) => Promise<Quest | null>;
  isLoading: boolean;
  error: ApiError | null;
}

export function useUpdateQuest(): UseUpdateQuestResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = async (id: string, input: QuestUpdateInput): Promise<Quest | null> => {
    setIsLoading(true);
    setError(null);

    try {
      return await updateQuestRequest(id, input);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('Falha ao atualizar a missão'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateQuest: submit, isLoading, error };
}
