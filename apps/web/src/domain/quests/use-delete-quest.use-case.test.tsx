import { ApiError } from '@core/http/http-client';
import { deleteQuest } from '@data/quests/quests.datasource';
import type { Quest } from '@domain/model/quest.model';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDeleteQuest } from './use-delete-quest.use-case';

vi.mock('@data/quests/quests.datasource', () => ({
  deleteQuest: vi.fn(),
}));

const deleteQuestMock = vi.mocked(deleteQuest);

const QUEST: Quest = {
  id: 'q_1',
  title: 'Enfrentar o dragão',
  description: 'Derrote a besta',
  status: 'open',
  difficulty: 'normal',
  xpReward: 25,
  dueDate: null,
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useDeleteQuest', () => {
  it('returns the deleted quest on success', async () => {
    deleteQuestMock.mockResolvedValue(QUEST);

    const { result } = renderHook(() => useDeleteQuest());

    let deleted: Quest | null = null;
    await act(async () => {
      deleted = await result.current.deleteQuest(QUEST.id);
    });

    expect(deleted).toEqual(QUEST);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('returns null and sets an ApiError when the datasource rejects', async () => {
    deleteQuestMock.mockRejectedValue(new ApiError('falhou'));

    const { result } = renderHook(() => useDeleteQuest());

    let deleted: Quest | null = QUEST;
    await act(async () => {
      deleted = await result.current.deleteQuest(QUEST.id);
    });

    expect(deleted).toBeNull();
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('falhou');
  });

  it('wraps a non-ApiError rejection in a generic ApiError', async () => {
    deleteQuestMock.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useDeleteQuest());

    await act(async () => {
      await result.current.deleteQuest(QUEST.id);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('Falha ao remover a missão');
  });
});
