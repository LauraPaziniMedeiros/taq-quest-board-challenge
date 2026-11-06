import { describe, expect, it } from 'vitest';
import { QUEST_DIFFICULTY_LABEL, formatQuestAge, getLevelTitle } from './quest-presentation';

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
