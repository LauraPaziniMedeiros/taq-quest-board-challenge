import { ApiError } from '@core/http/http-client';
import type { Quest } from '@domain/model/quest.model';
import { useCreateQuest } from '@domain/quests/use-create-quest.use-case';
import { useDeleteQuest } from '@domain/quests/use-delete-quest.use-case';
import { useListQuests } from '@domain/quests/use-list-quests.use-case';
import { useUpdateQuest } from '@domain/quests/use-update-quest.use-case';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuestBoardPage from './quest-board.page';

vi.mock('@domain/quests/use-list-quests.use-case', () => ({
  useListQuests: vi.fn(),
}));

vi.mock('@domain/quests/use-create-quest.use-case', () => ({
  useCreateQuest: vi.fn(),
}));

vi.mock('@domain/quests/use-update-quest.use-case', () => ({
  useUpdateQuest: vi.fn(),
}));

vi.mock('@domain/quests/use-delete-quest.use-case', () => ({
  useDeleteQuest: vi.fn(),
}));

const useListQuestsMock = vi.mocked(useListQuests);
const useCreateQuestMock = vi.mocked(useCreateQuest);
const useUpdateQuestMock = vi.mocked(useUpdateQuest);
const useDeleteQuestMock = vi.mocked(useDeleteQuest);

const OPEN_QUEST: Quest = {
  id: 'q_1',
  title: 'Enfrentar o dragão',
  description: 'Derrote a besta',
  status: 'open',
  difficulty: 'normal',
  xpReward: 25,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const refetch = vi.fn();
const createQuest = vi.fn();
const updateQuest = vi.fn();
const updateQuestInList = vi.fn();
const deleteQuest = vi.fn();
const removeQuestFromList = vi.fn();

beforeEach(() => {
  refetch.mockReset();
  createQuest.mockReset();
  updateQuest.mockReset();
  updateQuestInList.mockReset();
  deleteQuest.mockReset();
  removeQuestFromList.mockReset();
  useCreateQuestMock.mockReturnValue({ createQuest, isLoading: false, error: null });
  useUpdateQuestMock.mockReturnValue({ updateQuest, isLoading: false, error: null });
  useDeleteQuestMock.mockReturnValue({ deleteQuest, isLoading: false, error: null });
  useListQuestsMock.mockReturnValue({
    quests: [OPEN_QUEST],
    isLoading: false,
    error: null,
    refetch,
    updateQuestInList,
    removeQuestFromList,
  });
});

describe('QuestBoardPage', () => {
  it('shows the loading state while quests are being fetched', () => {
    useListQuestsMock.mockReturnValue({ quests: [], isLoading: true, error: null, refetch });

    render(<QuestBoardPage />);

    expect(screen.queryByText(OPEN_QUEST.title)).not.toBeInTheDocument();
  });

  it('keeps the board on screen while refetching', () => {
    useListQuestsMock.mockReturnValue({ quests: [OPEN_QUEST], isLoading: true, error: null, refetch });

    render(<QuestBoardPage />);

    expect(screen.getByText(OPEN_QUEST.title)).toBeInTheDocument();
  });

  it('shows the error state and retries on demand', async () => {
    const user = userEvent.setup();
    useListQuestsMock.mockReturnValue({
      quests: [],
      isLoading: false,
      error: new ApiError('Falha ao carregar as missões'),
      refetch,
    });

    render(<QuestBoardPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar as missões');

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('lists each quest under its status column', () => {
    render(<QuestBoardPage />);

    expect(screen.getByText(OPEN_QUEST.title)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pergaminhos Novos' })).toBeInTheDocument();
  });

  it('updates a quest status optimistically when advanced', async () => {
    const user = userEvent.setup();
    updateQuest.mockResolvedValue({ ...OPEN_QUEST, status: 'in_progress' });

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Aceitar missão' }));

    expect(updateQuestInList).toHaveBeenCalledWith({ ...OPEN_QUEST, status: 'in_progress' });
    expect(updateQuest).toHaveBeenCalledWith(OPEN_QUEST.id, { status: 'in_progress' });
    expect(updateQuestInList).toHaveBeenLastCalledWith({ ...OPEN_QUEST, status: 'in_progress' });
    expect(createQuest).not.toHaveBeenCalled();
  });

  it('rolls a quest back when an advance fails', async () => {
    const user = userEvent.setup();
    updateQuest.mockRejectedValue(new Error('falhou'));

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Aceitar missão' }));

    expect(updateQuestInList).toHaveBeenNthCalledWith(1, { ...OPEN_QUEST, status: 'in_progress' });
    expect(updateQuestInList).toHaveBeenLastCalledWith(OPEN_QUEST);
  });

  it('removes a quest after confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    deleteQuest.mockResolvedValue(OPEN_QUEST);

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Remover' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteQuest).toHaveBeenCalledWith(OPEN_QUEST.id);
    expect(removeQuestFromList).toHaveBeenCalledWith(OPEN_QUEST.id);

    confirmSpy.mockRestore();
  });

  it('does not remove a quest when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Remover' }));

    expect(deleteQuest).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('creates a quest and refetches the board on success', async () => {
    const user = userEvent.setup();
    createQuest.mockResolvedValue({ ...OPEN_QUEST, id: 'q_2', title: 'Nova missão criada' });

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Nova missão' }));
    await user.type(screen.getByLabelText('Título da missão'), 'Nova missão criada');
    await user.type(screen.getByLabelText('Descrição'), 'Descrição da missão');
    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));

    expect(createQuest).toHaveBeenCalledWith({
      title: 'Nova missão criada',
      description: 'Descrição da missão',
      difficulty: 'normal',
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('edits a quest and refetches the board on success', async () => {
    const user = userEvent.setup();
    updateQuest.mockResolvedValue({ ...OPEN_QUEST, title: 'Quest editada' });

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Editar' }));
    const titleInput = screen.getByLabelText('Título da missão');
    await user.clear(titleInput);
    await user.type(titleInput, 'Quest editada');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(updateQuest).toHaveBeenCalledWith(OPEN_QUEST.id, { title: 'Quest editada' });
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
