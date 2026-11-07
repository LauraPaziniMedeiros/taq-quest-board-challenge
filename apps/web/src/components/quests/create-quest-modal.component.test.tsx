import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateQuestModal } from './create-quest-modal.component';

describe('CreateQuestModal', () => {
  it('marks both fields as required', () => {
    render(
      <CreateQuestModal
        opened
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

    expect(screen.getByLabelText('Título da missão')).toBeRequired();
    expect(screen.getByLabelText('Descrição')).toBeRequired();
  });

  it('defaults the difficulty to normal and only offers the valid options', () => {
    render(
      <CreateQuestModal
        opened
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

    expect(screen.getByLabelText('Dificuldade')).toHaveValue('normal');
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(['Fácil', 'Normal', 'Difícil']);
  });

  it('explains which fields are missing instead of submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CreateQuestModal
        opened
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

    expect(screen.getByRole('button', { name: 'Publicar missão' })).toBeEnabled();
    await user.type(screen.getByLabelText('Título da missão'), '   ');
    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Título da missão')).toHaveFocus();
    expect(screen.getByLabelText('Título da missão')).toHaveAccessibleDescription('Informe o título da missão.');
    expect(screen.getByLabelText('Título da missão')).toBeInvalid();
    expect(screen.getByLabelText('Descrição')).toHaveAccessibleDescription('Informe a descrição da missão.');

    await user.type(screen.getByLabelText('Título da missão'), 'Enfrentar o dragão');
    expect(screen.getByLabelText('Título da missão')).not.toHaveAccessibleDescription();

    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));
    expect(screen.getByLabelText('Descrição')).toHaveFocus();
  });

  it('clears the validation messages when the modal is closed', async () => {
    const user = userEvent.setup();
    render(
      <CreateQuestModal
        opened
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

    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));
    expect(screen.getByText('Informe o título da missão.')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByText('Informe o título da missão.')).not.toBeInTheDocument();
  });

  it('submits the trimmed title and description, then clears the form on success', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <CreateQuestModal
        opened
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

    await user.type(screen.getByLabelText('Título da missão'), '  Enfrentar o dragão  ');
    await user.type(screen.getByLabelText('Descrição'), '  Derrote a besta  ');
    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Enfrentar o dragão',
      description: 'Derrote a besta',
      difficulty: 'normal',
      dueDate: null,
      tagIds: [],
    });
    expect(screen.getByLabelText('Título da missão')).toHaveValue('');
    expect(screen.getByLabelText('Descrição')).toHaveValue('');
    expect(screen.getByLabelText('Prazo (opcional)')).toHaveValue('');
  });

  it('submits the selected difficulty and resets it to normal on success', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <CreateQuestModal
        opened
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

    await user.type(screen.getByLabelText('Título da missão'), 'Enfrentar o dragão');
    await user.type(screen.getByLabelText('Descrição'), 'Derrote a besta');
    await user.selectOptions(screen.getByLabelText('Dificuldade'), 'high');
    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Enfrentar o dragão',
      description: 'Derrote a besta',
      difficulty: 'high',
      dueDate: null,
      tagIds: [],
    });
    expect(screen.getByLabelText('Dificuldade')).toHaveValue('normal');
  });

  it('submits an optional due date and resets it on success', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <CreateQuestModal
        opened
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

    await user.type(screen.getByLabelText('Título da missão'), 'Enfrentar o dragão');
    await user.type(screen.getByLabelText('Descrição'), 'Derrote a besta');
    fireEvent.change(screen.getByLabelText('Prazo (opcional)'), { target: { value: '31/12/2026' } });
    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Enfrentar o dragão',
      description: 'Derrote a besta',
      difficulty: 'normal',
      dueDate: '2026-12-31',
      tagIds: [],
    });
    expect(screen.getByLabelText('Prazo (opcional)')).toHaveValue('');
  });

  it('rejects an invalid due date instead of submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CreateQuestModal
        opened
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

    await user.type(screen.getByLabelText('Título da missão'), 'Enfrentar o dragão');
    await user.type(screen.getByLabelText('Descrição'), 'Derrote a besta');
    fireEvent.change(screen.getByLabelText('Prazo (opcional)'), { target: { value: '31/02/2026' } });
    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Prazo (opcional)')).toHaveFocus();
    expect(screen.getByLabelText('Prazo (opcional)')).toHaveAccessibleDescription(
      'Informe uma data válida (dd/mm/aaaa).',
    );
  });

  it('keeps the form filled when the submission fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(
      <CreateQuestModal
        opened
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

    await user.type(screen.getByLabelText('Título da missão'), 'Enfrentar o dragão');
    await user.type(screen.getByLabelText('Descrição'), 'Derrote a besta');
    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));

    expect(screen.getByLabelText('Título da missão')).toHaveValue('Enfrentar o dragão');
  });

  it('shows the error message when one is given', () => {
    render(
      <CreateQuestModal
        opened
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
        tags={[]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
        errorMessage="Falha ao publicar a missão"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao publicar a missão');
  });
});

describe('CreateQuestModal tags', () => {
  it('submits the selected tag ids', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <CreateQuestModal
        opened
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        tags={[{ id: 't_1', name: 'Dragão' }]}
        tagsLoading={false}
        isTagMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Título da missão'), 'Caçar');
    await user.type(screen.getByLabelText('Descrição'), 'Encontre a fera');
    await user.click(screen.getByRole('checkbox', { name: 'Dragão' }));
    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Caçar', description: 'Encontre a fera', tagIds: ['t_1'] }),
    );
  });

  it('does not submit while a tag mutation is in progress', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CreateQuestModal
        opened
        onClose={vi.fn()}
        onSubmit={onSubmit}
        isLoading={false}
        tags={[]}
        tagsLoading={false}
        isTagMutating
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Título da missão'), 'Caçar');
    await user.type(screen.getByLabelText('Descrição'), 'Encontre a fera');
    await user.click(screen.getByRole('button', { name: 'Publicar missão' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
