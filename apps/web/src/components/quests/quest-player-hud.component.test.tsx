import type { Quest } from '@domain/model/quest.model';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuestPlayerHud, calculatePlayerProgress } from './quest-player-hud.component';

const QUESTS: Quest[] = [
  {
    id: 'q_1',
    title: 'A',
    description: 'a',
    status: 'resolved',
    difficulty: 'easy',
    xpReward: 10,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'q_2',
    title: 'B',
    description: 'b',
    status: 'open',
    difficulty: 'high',
    xpReward: 50,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'q_3',
    title: 'C',
    description: 'c',
    status: 'resolved',
    difficulty: 'normal',
    xpReward: 25,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('calculatePlayerProgress', () => {
  it('sums only resolved quests', () => {
    expect(calculatePlayerProgress(QUESTS)).toEqual({ totalXp: 35, level: 1, currentLevelXp: 35 });
  });

  it('advances a level every 100 XP', () => {
    const quests: Quest[] = [
      { ...QUESTS[0]!, status: 'resolved', xpReward: 100 },
      { ...QUESTS[2]!, status: 'resolved', xpReward: 25 },
    ];
    expect(calculatePlayerProgress(quests)).toEqual({ totalXp: 125, level: 2, currentLevelXp: 25 });
  });
});

describe('QuestPlayerHud', () => {
  it('shows zero progress for a new player', () => {
    render(<QuestPlayerHud quests={[]} />);

    expect(screen.getByText('0 / 100 XP')).toBeInTheDocument();
    expect(screen.getByText(/N\u00edvel 1/)).toBeInTheDocument();
    expect(screen.getByText(/Recruta/, { selector: '.font-secondary' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('shows in-level progress and level from resolved quests', () => {
    render(<QuestPlayerHud quests={QUESTS} />);

    expect(screen.getByText('35 / 100 XP')).toBeInTheDocument();
    expect(screen.getByText(/N\u00edvel 1/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '35');
  });

  it('updates the level when XP reaches 100', () => {
    render(<QuestPlayerHud totalXp={100} />);

    expect(screen.getByText('0 / 100 XP')).toBeInTheDocument();
    expect(screen.getByText(/N\u00edvel 2/)).toBeInTheDocument();
  });
});

describe('QuestPlayerHud level titles', () => {
  it('shows a different title for each level', () => {
    const { unmount: unmountFirst } = render(<QuestPlayerHud totalXp={0} />);
    expect(screen.getByText(/Recruta/, { selector: '.font-secondary' })).toBeInTheDocument();
    unmountFirst();

    const { unmount: unmountSecond } = render(<QuestPlayerHud totalXp={100} />);
    expect(screen.getByText(/Aventureiro/, { selector: '.font-secondary' })).toBeInTheDocument();
    unmountSecond();

    render(<QuestPlayerHud totalXp={200} />);
    expect(screen.getByText(/Herói/, { selector: '.font-secondary' })).toBeInTheDocument();
  });

  it('celebrates when reaching a new level', () => {
    const { rerender } = render(<QuestPlayerHud totalXp={0} />);
    rerender(<QuestPlayerHud totalXp={100} />);

    expect(screen.getByRole('status')).toHaveTextContent(/Parab/);
    expect(screen.getByRole('status')).toHaveTextContent(/Aventureiro/);
  });
});
