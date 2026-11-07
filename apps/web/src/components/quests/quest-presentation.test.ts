import type { Quest } from '@domain/model/quest.model';
import { describe, expect, it } from 'vitest';
import {
  QUEST_DIFFICULTY_LABEL,
  formatDueDateInput,
  formatQuestAge,
  formatQuestDueDate,
  getLevelTitle,
  isQuestPastDue,
  parseDueDateInput,
} from './quest-presentation';

describe('quest-presentation', () => {
  it('has a label for every quest difficulty', () => {
    expect(QUEST_DIFFICULTY_LABEL).toEqual({
      easy: 'Fácil',
      normal: 'Normal',
      high: 'Difícil',
    });
  });

  it('formats a recent date as a relative age', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    expect(formatQuestAge(oneHourAgo)).toBe('Aberta há cerca de 1 hora');
  });

  it('formats a due date as a Brazilian day/month/year', () => {
    expect(formatQuestDueDate('2026-12-31')).toBe('31/12/2026');
  });

  it('formats and parses the due date input in the Brazilian pattern', () => {
    expect(formatDueDateInput('2026-12-31')).toBe('31/12/2026');
    expect(formatDueDateInput(null)).toBe('');
    expect(parseDueDateInput('31/12/2026')).toBe('2026-12-31');
    expect(parseDueDateInput('29/02/2024')).toBe('2024-02-29');
    expect(parseDueDateInput('')).toBeNull();
    expect(parseDueDateInput('31/02/2026')).toBeNull();
    expect(parseDueDateInput('2026-12-31')).toBeNull();
  });

  it('only marks active quests with a due date before today as past due', () => {
    const now = new Date(2026, 10, 6, 12);
    const quest = (dueDate: string | null, status: Quest['status'] = 'open') =>
      ({ dueDate, status }) as Pick<Quest, 'dueDate' | 'status'>;

    expect(isQuestPastDue(quest('2026-11-05'), now)).toBe(true);
    expect(isQuestPastDue(quest('2026-11-06'), now)).toBe(false);
    expect(isQuestPastDue(quest('2026-11-07'), now)).toBe(false);
    expect(isQuestPastDue(quest(null), now)).toBe(false);
    expect(isQuestPastDue(quest('2026-11-05', 'resolved'), now)).toBe(false);
  });

  it('starts every user as Recruta', () => {
    expect(getLevelTitle(1)).toBe('Recruta');
    expect(getLevelTitle(0)).toBe('Recruta');
  });

  it('updates the title for each level', () => {
    expect(getLevelTitle(1)).toBe('Recruta');
    expect(getLevelTitle(2)).toBe('Aventureiro');
    expect(getLevelTitle(3)).toBe('Herói');
    expect(getLevelTitle(4)).toBe('Lenda');
    expect(getLevelTitle(10)).toBe('Lenda');
  });
});
