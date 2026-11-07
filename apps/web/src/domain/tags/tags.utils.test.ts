import { describe, expect, it } from 'vitest';
import { normalizeTagName, sortTags } from './tags.utils';

describe('normalizeTagName', () => {
  it('trims, normalizes unicode and lowercases with the pt-BR locale', () => {
    expect(normalizeTagName('  Draga\u0303o  ')).toBe('dragão');
  });
});

describe('sortTags', () => {
  it('sorts tags by name without mutating the input', () => {
    const tags = [{ name: 'Zumbi' }, { name: 'Arqueiro' }, { name: 'Árvore' }];

    expect(sortTags(tags).map(tag => tag.name)).toEqual(['Arqueiro', 'Árvore', 'Zumbi']);
    expect(tags.map(tag => tag.name)).toEqual(['Zumbi', 'Arqueiro', 'Árvore']);
  });
});
