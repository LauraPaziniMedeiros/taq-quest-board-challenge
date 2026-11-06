import type { Quest } from '@domain/model/quest.model';
import { render, screen } from '@testing-library/react';
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
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('EditQuestModal', () => {
  it('initializes the fields from the quest', () => {
    render(<EditQuestModal opened quest={QUEST} onClose={vi.fn()} onSubmit={vi.fn()} isLoading={false} />);

    expect(screen.getByLabelText('Título da missão')).toHaveValue(QUEST.title);
    expect(screen.getByLabelText('Descrição')).toHaveValue(QUEST.description);
    expect(screen.getByLabelText('Dificuldade')).toHaveValue(QUEST.difficulty);
  });

  it('only offers the valid difficulties', () => {
    render(<EditQuestModal opened quest={QUEST} onClose={vi.fn()} onSubmit={vi.fn()} isLoading={false} />);

    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(['Fácil', 'Normal', 'Difícil']);
  });

  it('submits only the changed fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<EditQuestModal opened quest={QUEST} onClose={vi.fn()} onSubmit={onSubmit} isLoading={false} />);

    const titleInput = screen.getByLabelText('Título da missão');
    await user.clear(titleInput);
    await user.type(titleInput, '  Novo título  ');
    await user.selectOptions(screen.getByLabelText('Dificuldade'), 'high');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Novo título', difficulty: 'high' });
  });

  it('does not submit when required fields are empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EditQuestModal opened quest={QUEST} onClose={vi.fn()} onSubmit={onSubmit} isLoading={false} />);

    const titleInput = screen.getByLabelText('Título da missão');
    await user.clear(titleInput);
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
