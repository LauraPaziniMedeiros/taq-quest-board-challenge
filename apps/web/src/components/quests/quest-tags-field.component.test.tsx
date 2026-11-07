import type { Tag } from '@domain/model/tag.model';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QuestTagsField } from './quest-tags-field.component';

const DRAGON: Tag = { id: 't_1', name: 'Dragão' };
const ARCHER: Tag = { id: 't_2', name: 'Arqueiro' };

function renderField(props: Partial<ComponentProps<typeof QuestTagsField>> = {}) {
  const onChange = vi.fn();
  render(
    <QuestTagsField
      id="quest-tags"
      selectedTagIds={[]}
      onChange={onChange}
      tags={[DRAGON, ARCHER]}
      isLoading={false}
      isMutating={false}
      onCreateTag={vi.fn()}
      onDeleteTag={vi.fn()}
      {...props}
    />,
  );
  return { onChange };
}

describe('QuestTagsField', () => {
  it('shows the selected tags and marks them in the catalog', () => {
    renderField({ selectedTagIds: [DRAGON.id] });

    expect(screen.getByLabelText('Tags selecionadas')).toHaveTextContent('Dragão');
    expect(screen.getByRole('checkbox', { name: 'Dragão' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Arqueiro' })).not.toBeChecked();
  });

  it('adds and removes tags through the catalog checkboxes', async () => {
    const user = userEvent.setup();
    const { onChange } = renderField({ selectedTagIds: [DRAGON.id] });

    await user.click(screen.getByRole('checkbox', { name: 'Arqueiro' }));
    expect(onChange).toHaveBeenLastCalledWith([DRAGON.id, ARCHER.id]);

    await user.click(screen.getByRole('checkbox', { name: 'Dragão' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('removes a selected tag from its chip', async () => {
    const user = userEvent.setup();
    const { onChange } = renderField({ selectedTagIds: [DRAGON.id] });

    await user.click(screen.getByRole('button', { name: 'Remover tag Dragão da missão' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('blocks selecting more than ten tags', async () => {
    const user = userEvent.setup();
    const tags = Array.from({ length: 11 }, (_, index) => ({ id: `t_${index + 1}`, name: `Tag ${index + 1}` }));
    const { onChange } = renderField({
      tags,
      selectedTagIds: tags.slice(0, 10).map(tag => tag.id),
    });

    await user.click(screen.getByRole('checkbox', { name: 'Tag 11' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha no máximo 10 tags.');
  });

  it('selects an existing tag instead of creating a duplicate spelling', async () => {
    const user = userEvent.setup();
    const onCreateTag = vi.fn();
    const { onChange } = renderField({ onCreateTag });

    await user.type(screen.getByLabelText('Criar nova tag'), '  DRAGÃO  ');
    await user.click(screen.getByRole('button', { name: 'Criar tag' }));

    expect(onCreateTag).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith([DRAGON.id]);
    expect(screen.getByLabelText('Criar nova tag')).toHaveValue('');
  });

  it('creates a new tag and selects it', async () => {
    const user = userEvent.setup();
    const WITCH = { id: 't_3', name: 'Bruxa' };
    const onCreateTag = vi.fn().mockResolvedValue(WITCH);
    const { onChange } = renderField({ onCreateTag });

    await user.type(screen.getByLabelText('Criar nova tag'), 'Bruxa');
    await user.click(screen.getByRole('button', { name: 'Criar tag' }));

    expect(onCreateTag).toHaveBeenCalledWith('Bruxa');
    expect(onChange).toHaveBeenCalledWith([WITCH.id]);
  });

  it('rejects a tag longer than thirty characters without creating it', async () => {
    const onCreateTag = vi.fn();
    renderField({ onCreateTag });

    fireEvent.change(screen.getByLabelText('Criar nova tag'), { target: { value: 'a'.repeat(31) } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar tag' }));

    expect(onCreateTag).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('A tag deve ter no máximo 30 caracteres.');
  });

  it('deletes a tag from the catalog after confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onDeleteTag = vi.fn().mockResolvedValue(true);
    const { onChange } = renderField({ selectedTagIds: [DRAGON.id], onDeleteTag });

    await user.click(screen.getByRole('button', { name: 'Excluir tag Dragão do catálogo' }));

    expect(confirmSpy).toHaveBeenCalledWith(
      'Excluir a tag "Dragão" do catálogo? Ela será removida de todas as missões.',
    );
    expect(onDeleteTag).toHaveBeenCalledWith(DRAGON);
    expect(onChange).toHaveBeenCalledWith([]);

    confirmSpy.mockRestore();
  });

  it('keeps the tag when deletion is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onDeleteTag = vi.fn();
    renderField({ onDeleteTag });

    await user.click(screen.getByRole('button', { name: 'Excluir tag Dragão do catálogo' }));

    expect(onDeleteTag).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('shows loading, empty and error states', () => {
    const { unmount } = render(
      <QuestTagsField
        id="quest-tags"
        selectedTagIds={[]}
        onChange={vi.fn()}
        tags={[]}
        isLoading
        isMutating={false}
        onCreateTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
    );
    expect(screen.getByText('Carregando tags...')).toBeInTheDocument();
    unmount();

    renderField({ tags: [] });
    expect(screen.getByText('Nenhuma tag disponível.')).toBeInTheDocument();
  });

  it('shows a catalog error instead of the empty state', () => {
    renderField({ tags: [], errorMessage: 'Falha ao carregar as tags' });

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar as tags');
    expect(screen.queryByText('Nenhuma tag disponível.')).not.toBeInTheDocument();
  });
});
