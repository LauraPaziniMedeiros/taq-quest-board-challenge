import type { Quest } from '@domain/model/quest.model';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestCard } from './quest-card.component';

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

function renderCard(quest: Quest) {
  return render(
    <QuestCard
      quest={quest}
      columnStatus={quest.status}
      onAdvance={vi.fn()}
      onEdit={vi.fn()}
      onRemove={vi.fn()}
      onDuplicate={vi.fn()}
    />,
  );
}

describe('QuestCard due date', () => {
  it('shows a formatted due date without an overdue badge for a future date', () => {
    renderCard({ ...QUEST, dueDate: '2999-12-31' });

    expect(screen.getByText('Prazo: 31/12/2999')).toBeInTheDocument();
    expect(screen.queryByText('Atrasada')).not.toBeInTheDocument();
  });

  it('highlights an active quest whose due date has passed', () => {
    const { container } = renderCard({ ...QUEST, dueDate: '2000-01-01' });

    expect(screen.getByText('Prazo: 01/01/2000')).toBeInTheDocument();
    expect(screen.getByText('Atrasada')).toBeInTheDocument();
    expect(container.querySelector('article')).toHaveClass('border-feedback-danger');
  });

  it('does not highlight a resolved quest whose due date has passed', () => {
    renderCard({ ...QUEST, status: 'resolved', dueDate: '2000-01-01' });

    expect(screen.getByText('Prazo: 01/01/2000')).toBeInTheDocument();
    expect(screen.queryByText('Atrasada')).not.toBeInTheDocument();
  });

  it('does not show a due date when the quest has none', () => {
    renderCard(QUEST);

    expect(screen.queryByText(/Prazo:/)).not.toBeInTheDocument();
  });
});

describe('QuestCard tags', () => {
  it('lists the quest tags', () => {
    renderCard({
      ...QUEST,
      tags: [
        { id: 't_1', name: 'Dragão' },
        { id: 't_2', name: 'Arqueiro' },
      ],
    });

    const tags = screen.getByLabelText('Tags');
    expect(tags).toHaveTextContent('Dragão');
    expect(tags).toHaveTextContent('Arqueiro');
  });

  it('does not render the tag list when the quest has no tags', () => {
    renderCard(QUEST);

    expect(screen.queryByLabelText('Tags')).not.toBeInTheDocument();
  });
});
