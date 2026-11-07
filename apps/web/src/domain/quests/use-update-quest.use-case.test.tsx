import { ApiError } from '@core/http/http-client';
import { updateQuest } from '@data/quests/quests.datasource';
import type { Quest, QuestUpdateInput } from '@domain/model/quest.model';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useUpdateQuest } from './use-update-quest.use-case';

vi.mock('@data/quests/quests.datasource', () => ({
  updateQuest: vi.fn(),
}));

const updateQuestMock = vi.mocked(updateQuest);

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

const INPUT: QuestUpdateInput = { title: 'Novo título' };

describe('useUpdateQuest', () => {
  it('returns the updated quest on success', async () => {
    updateQuestMock.mockResolvedValue({ ...QUEST, title: 'Novo título' });

    const { result } = renderHook(() => useUpdateQuest());

    let updated: Quest | null = null;
    await act(async () => {
      updated = await result.current.updateQuest(QUEST.id, INPUT);
    });

    expect(updated).toEqual({ ...QUEST, title: 'Novo título' });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('returns null and sets an ApiError when the datasource rejects', async () => {
    updateQuestMock.mockRejectedValue(new ApiError('falhou'));

    const { result } = renderHook(() => useUpdateQuest());

    let updated: Quest | null = QUEST;
    await act(async () => {
      updated = await result.current.updateQuest(QUEST.id, INPUT);
    });

    expect(updated).toBeNull();
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('falhou');
  });

  it('wraps a non-ApiError rejection in a generic ApiError', async () => {
    updateQuestMock.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useUpdateQuest());

    await act(async () => {
      await result.current.updateQuest(QUEST.id, INPUT);
    });

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('Falha ao atualizar a missão');
  });
});
