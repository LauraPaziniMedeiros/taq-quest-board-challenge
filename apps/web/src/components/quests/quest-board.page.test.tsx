import { ApiError } from '@core/http/http-client';
import type { Quest } from '@domain/model/quest.model';
import { useCreateQuest } from '@domain/quests/use-create-quest.use-case';
import { useDeleteQuest } from '@domain/quests/use-delete-quest.use-case';
import { useListQuests } from '@domain/quests/use-list-quests.use-case';
import { useUpdateQuest } from '@domain/quests/use-update-quest.use-case';
import { useTags } from '@domain/tags/use-tags.use-case';
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

vi.mock('@domain/tags/use-tags.use-case', () => ({
  useTags: vi.fn(),
}));

const useListQuestsMock = vi.mocked(useListQuests);
const useCreateQuestMock = vi.mocked(useCreateQuest);
const useUpdateQuestMock = vi.mocked(useUpdateQuest);
const useDeleteQuestMock = vi.mocked(useDeleteQuest);
const useTagsMock = vi.mocked(useTags);

const OPEN_QUEST: Quest = {
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

const refetch = vi.fn();
const createQuest = vi.fn();
const updateQuest = vi.fn();
const updateQuestInList = vi.fn();
const deleteQuest = vi.fn();
const removeQuestFromList = vi.fn();
const createTag = vi.fn();
const deleteTag = vi.fn();
const refetchTags = vi.fn();

beforeEach(() => {
  window.localStorage.removeItem('quest-board-theme');
  document.documentElement.classList.remove('dark');
  refetch.mockReset();
  createQuest.mockReset();
  updateQuest.mockReset();
  updateQuestInList.mockReset();
  deleteQuest.mockReset();
  removeQuestFromList.mockReset();
  createTag.mockReset();
  deleteTag.mockReset();
  refetchTags.mockReset();
  useCreateQuestMock.mockReturnValue({ createQuest, isLoading: false, error: null });
  useUpdateQuestMock.mockReturnValue({ updateQuest, isLoading: false, error: null });
  useDeleteQuestMock.mockReturnValue({ deleteQuest, isLoading: false, error: null });
  useTagsMock.mockReturnValue({
    tags: [],
    isLoading: false,
    error: null,
    isMutating: false,
    mutationError: null,
    refetch: refetchTags,
    createTag,
    deleteTag,
    addTagLocally: vi.fn(),
    removeTagLocally: vi.fn(),
    clearMutationError: vi.fn(),
  });
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

  it('toggles and persists the board theme', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Ativar tema escuro' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem('quest-board-theme')).toBe('dark');

    unmount();
    render(<QuestBoardPage />);

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Ativar tema claro' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates a quest status optimistically when advanced', async () => {
    const user = userEvent.setup();
    updateQuest.mockResolvedValue({ ...OPEN_QUEST, status: 'in_progress' });

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Aceitar missão' }));

    expect(updateQuestInList).toHaveBeenCalledWith({ ...OPEN_QUEST, status: 'in_progress' });
    expect(updateQuest).toHaveBeenCalledWith(OPEN_QUEST.id, { status: 'in_progress' });
    expect(updateQuestInList).toHaveBeenLastCalledWith({ ...OPEN_QUEST, status: 'in_progress' });
    expect(await screen.findByRole('status')).toHaveTextContent(`${OPEN_QUEST.title} movida para Em Jornada.`);
    expect(createQuest).not.toHaveBeenCalled();
  });

  it('rolls a quest back when an advance fails', async () => {
    const user = userEvent.setup();
    updateQuest.mockRejectedValue(new Error('falhou'));

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Aceitar missão' }));

    expect(updateQuestInList).toHaveBeenNthCalledWith(1, { ...OPEN_QUEST, status: 'in_progress' });
    expect(updateQuestInList).toHaveBeenLastCalledWith(OPEN_QUEST);
    expect(await screen.findByRole('status')).toHaveTextContent(
      `Falha ao mover ${OPEN_QUEST.title} para Em Jornada. Tente novamente.`,
    );
  });

  it('announces removal after confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    deleteQuest.mockResolvedValue(OPEN_QUEST);

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Remover' }));

    expect(confirmSpy).toHaveBeenCalledWith(`Remover a missão "${OPEN_QUEST.title}"?`);
    expect(deleteQuest).toHaveBeenCalledWith(OPEN_QUEST.id);
    expect(removeQuestFromList).toHaveBeenCalledWith(OPEN_QUEST.id);
    expect(await screen.findByText(`"${OPEN_QUEST.title}" removida.`)).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('announces that resolved quest XP stops counting after removal', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const RESOLVED_QUEST: Quest = { ...OPEN_QUEST, status: 'resolved', xpReward: 100 };
    deleteQuest.mockResolvedValue(RESOLVED_QUEST);
    useListQuestsMock.mockReturnValue({
      quests: [RESOLVED_QUEST],
      isLoading: false,
      error: null,
      refetch,
      updateQuestInList,
      removeQuestFromList,
    });

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Remover' }));

    expect(confirmSpy).toHaveBeenCalledWith(
      `Remover a missão "${RESOLVED_QUEST.title}"? O XP dela (100 XP) será descontado da sua pontuação.`,
    );
    expect(await screen.findByText(/O XP dela não será mais contado no quadro/)).toBeInTheDocument();

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

  it('duplicates a quest with only its editable fields', async () => {
    const user = userEvent.setup();
    createQuest.mockResolvedValue({ ...OPEN_QUEST, id: 'q_2' });

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Duplicar' }));

    expect(createQuest).toHaveBeenCalledWith({
      title: OPEN_QUEST.title,
      description: OPEN_QUEST.description,
      difficulty: OPEN_QUEST.difficulty,
      dueDate: OPEN_QUEST.dueDate,
      tagIds: [],
    });
    expect(createQuest).not.toHaveBeenCalledWith(expect.objectContaining({ status: expect.anything() }));
    expect(createQuest).not.toHaveBeenCalledWith(expect.objectContaining({ id: expect.anything() }));
    expect(createQuest).not.toHaveBeenCalledWith(expect.objectContaining({ xpReward: expect.anything() }));
    expect(
      await screen.findByText(`Cópia de "${OPEN_QUEST.title}" criada. Modal de edição aberto.`),
    ).toBeInTheDocument();
  });

  it('copies the due date when duplicating a quest', async () => {
    const user = userEvent.setup();
    const questWithDueDate = { ...OPEN_QUEST, dueDate: '2026-12-31' };
    useListQuestsMock.mockReturnValue({
      quests: [questWithDueDate],
      isLoading: false,
      error: null,
      refetch,
      updateQuestInList,
      removeQuestFromList,
    });
    createQuest.mockResolvedValue({ ...questWithDueDate, id: 'q_2' });

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Duplicar' }));

    expect(createQuest).toHaveBeenCalledWith(expect.objectContaining({ dueDate: '2026-12-31' }));
  });

  it('opens the duplicate for editing after creating it', async () => {
    const user = userEvent.setup();
    createQuest.mockResolvedValue({ ...OPEN_QUEST, id: 'q_2', title: 'Cópia da missão' });

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Duplicar' }));

    expect(screen.getByText('Editar missão')).toBeInTheDocument();
    expect(screen.getByLabelText('Título da missão')).toHaveValue('Cópia da missão');
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
      dueDate: null,
      tagIds: [],
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Missão "Nova missão criada" criada.')).toBeInTheDocument();
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
    expect(await screen.findByText('Missão "Quest editada" atualizada.')).toBeInTheDocument();
  });

  it('announces sorting a column', async () => {
    const user = userEvent.setup();

    render(<QuestBoardPage />);

    await user.selectOptions(screen.getAllByLabelText('Ordenar missões')[0]!, 'xp_desc');

    expect(await screen.findByText('Coluna Pergaminhos Novos ordenada por maior XP.')).toBeInTheDocument();
  });

  it('announces filtering by difficulty', async () => {
    const user = userEvent.setup();

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('checkbox', { name: 'Normal' }));

    expect(await screen.findByText('Filtro de dificuldade aplicado: Normal. Mostrando 1 missões.')).toBeInTheDocument();
  });
});

describe('QuestBoardPage tags', () => {
  const DRAGON = { id: 't_1', name: 'Dragão' };
  const ARCHER = { id: 't_2', name: 'Arqueiro' };

  function mockQuestList(quests: Quest[]) {
    useListQuestsMock.mockReturnValue({
      quests,
      isLoading: false,
      error: null,
      refetch,
      updateQuestInList,
      removeQuestFromList,
    });
  }

  it('copies the quest tags when duplicating', async () => {
    const user = userEvent.setup();
    const taggedQuest = { ...OPEN_QUEST, tags: [DRAGON] };
    mockQuestList([taggedQuest]);
    createQuest.mockResolvedValue({ ...taggedQuest, id: 'q_2' });

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('button', { name: 'Duplicar' }));

    expect(createQuest).toHaveBeenCalledWith(expect.objectContaining({ tagIds: [DRAGON.id] }));
  });

  it('derives the tag filter from the loaded quests, not the whole catalog', () => {
    const WITCH = { id: 't_3', name: 'Bruxa' };
    useTagsMock.mockReturnValue({
      tags: [DRAGON, WITCH],
      isLoading: false,
      error: null,
      isMutating: false,
      mutationError: null,
      refetch: refetchTags,
      createTag,
      deleteTag,
      addTagLocally: vi.fn(),
      removeTagLocally: vi.fn(),
      clearMutationError: vi.fn(),
    });
    mockQuestList([{ ...OPEN_QUEST, tags: [DRAGON] }]);

    render(<QuestBoardPage />);

    expect(screen.getByRole('checkbox', { name: 'Dragão' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Bruxa' })).not.toBeInTheDocument();
  });

  it('filters quests by any of the selected tags and announces the result', async () => {
    const user = userEvent.setup();
    const dragonQuest = { ...OPEN_QUEST, id: 'q_1', title: 'Caçar dragão', tags: [DRAGON] };
    const archerQuest = { ...OPEN_QUEST, id: 'q_2', title: 'Ajudar arqueiro', tags: [ARCHER] };
    mockQuestList([dragonQuest, archerQuest]);

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('checkbox', { name: 'Dragão' }));
    expect(screen.getByText('Caçar dragão')).toBeInTheDocument();
    expect(screen.queryByText('Ajudar arqueiro')).not.toBeInTheDocument();
    expect(await screen.findByText('Filtro de tags aplicado: Dragão. Mostrando 1 missões.')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Arqueiro' }));
    expect(screen.getByText('Caçar dragão')).toBeInTheDocument();
    expect(screen.getByText('Ajudar arqueiro')).toBeInTheDocument();
    expect(await screen.findByText(/Filtro de tags aplicado: .*Mostrando 2 missões\./)).toBeInTheDocument();
  });

  it('combines tag and difficulty filters with AND', async () => {
    const user = userEvent.setup();
    const normalQuest = { ...OPEN_QUEST, id: 'q_1', title: 'Caçar dragão', tags: [DRAGON] };
    const hardQuest = {
      ...OPEN_QUEST,
      id: 'q_2',
      title: 'Enfrentar dragão ancião',
      difficulty: 'high' as const,
      tags: [DRAGON],
    };
    mockQuestList([normalQuest, hardQuest]);

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('checkbox', { name: 'Dragão' }));
    expect(screen.getByText('Enfrentar dragão ancião')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Normal' }));

    expect(screen.getByText('Caçar dragão')).toBeInTheDocument();
    expect(screen.queryByText('Enfrentar dragão ancião')).not.toBeInTheDocument();
  });

  it('clears every selected tag filter', async () => {
    const user = userEvent.setup();
    const taggedQuest = { ...OPEN_QUEST, tags: [DRAGON] };
    mockQuestList([taggedQuest]);

    render(<QuestBoardPage />);

    await user.click(screen.getByRole('checkbox', { name: 'Dragão' }));
    await user.click(screen.getByRole('button', { name: 'Limpar tags' }));

    expect(screen.getByRole('checkbox', { name: 'Dragão' })).not.toBeChecked();
    expect(await screen.findByText('Filtro de tags removido. Mostrando 1 missões.')).toBeInTheDocument();
  });
});
