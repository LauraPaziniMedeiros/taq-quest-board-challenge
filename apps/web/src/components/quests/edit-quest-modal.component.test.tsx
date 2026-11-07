import type { Quest } from '@domain/model/quest.model';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditQuestModal } from './edit-quest-modal.component';

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

describe('EditQuestModal', () => {
  it('initializes the fields from the quest', () => {
    render(
      <EditQuestModal
        opened
        quest={QUEST}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
        tags={[]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Título da missão')).toHaveValue(QUEST.title);
    expect(screen.getByLabelText('Descrição')).toHaveValue(QUEST.description);
    expect(screen.getByLabelText('Dificuldade')).toHaveValue(QUEST.difficulty);
    expect(screen.getByLabelText('Prazo (opcional)')).toHaveValue('');
  });

  it('initializes the due date from the quest', () => {
    render(
      <EditQuestModal
        opened
        quest={{ ...QUEST, dueDate: '2026-12-31' }}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
        tags={[]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Prazo (opcional)')).toHaveValue('31/12/2026');
  });

  it('only offers the valid difficulties', () => {
    render(
      <EditQuestModal
        opened
        quest={QUEST}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
        tags={[]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(['Fácil', 'Normal', 'Difícil']);
  });

  it('submits only the changed fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <EditQuestModal
        opened
        quest={QUEST}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        tags={[]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    const titleInput = screen.getByLabelText('Título da missão');
    await user.clear(titleInput);
    await user.type(titleInput, '  Novo título  ');
    await user.selectOptions(screen.getByLabelText('Dificuldade'), 'high');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Novo título', difficulty: 'high' });
  });

  it('submits a changed due date', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <EditQuestModal
        opened
        quest={QUEST}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        tags={[]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Prazo (opcional)'), { target: { value: '31/12/2026' } });
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).toHaveBeenCalledWith({ dueDate: '2026-12-31' });
  });

  it('rejects an invalid due date instead of submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <EditQuestModal
        opened
        quest={QUEST}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        tags={[]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Prazo (opcional)'), { target: { value: '31/02/2026' } });
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Prazo (opcional)')).toHaveFocus();
    expect(screen.getByLabelText('Prazo (opcional)')).toHaveAccessibleDescription(
      'Informe uma data válida (dd/mm/aaaa).',
    );
  });

  it('clears the due date when the field is emptied', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <EditQuestModal
        opened
        quest={{ ...QUEST, dueDate: '2026-12-31' }}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        tags={[]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Prazo (opcional)'), { target: { value: '' } });
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).toHaveBeenCalledWith({ dueDate: null });
  });

  it('does not submit when required fields are empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <EditQuestModal
        opened
        quest={QUEST}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        tags={[]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    const titleInput = screen.getByLabelText('Título da missão');
    await user.clear(titleInput);
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('EditQuestModal tags', () => {
  const TAG = { id: 't_1', name: 'Dragão' };

  it('submits an added tag', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <EditQuestModal
        opened
        quest={QUEST}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        tags={[TAG]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Dragão' }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).toHaveBeenCalledWith({ tagIds: [TAG.id] });
  });

  it('initializes the selected tags from the quest and submits a removal', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <EditQuestModal
        opened
        quest={{ ...QUEST, tags: [TAG] }}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        tags={[TAG]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Dragão' })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Dragão' }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).toHaveBeenCalledWith({ tagIds: [] });
  });

  it('does not send tagIds when the tags are unchanged', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <EditQuestModal
        opened
        quest={{ ...QUEST, tags: [TAG] }}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        tags={[TAG]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).toHaveBeenCalledWith({});
  });
});
