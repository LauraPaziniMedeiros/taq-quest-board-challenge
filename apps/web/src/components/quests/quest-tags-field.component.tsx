import { FaIcon } from '@atomic/atm.fa-icon';
import { TextInput } from '@atomic/atm.text-input';
import type { Tag } from '@domain/model/tag.model';
import { normalizeTagName, TAG_LIMIT, TAG_NAME_MAX_LENGTH } from '@domain/tags/tags.utils';
import { type FormEvent, useEffect, useState } from 'react';

interface QuestTagsFieldProps {
  id: string;
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  tags: Tag[];
  isLoading: boolean;
  errorMessage?: string | null;
  isMutating: boolean;
  mutationError?: string | null;
  onCreateTag: (name: string) => Promise<Tag | null>;
  onDeleteTag: (tag: Tag) => Promise<boolean>;
}

export function QuestTagsField(props: QuestTagsFieldProps) {
  const { id, selectedTagIds, onChange, tags, isLoading, errorMessage, isMutating, mutationError } = props;
  const [draft, setDraft] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const validIds = selectedTagIds.filter(tagId => tags.some(tag => tag.id === tagId));
    if (validIds.length !== selectedTagIds.length) {
      onChange(validIds);
    }
  }, [isLoading, onChange, selectedTagIds, tags]);

  const selectedTags = selectedTagIds
    .map(tagId => tags.find(tag => tag.id === tagId))
    .filter((tag): tag is Tag => Boolean(tag));

  const toggleTag = (tag: Tag, checked: boolean) => {
    setValidationError(null);

    if (checked) {
      if (selectedTagIds.length >= TAG_LIMIT) {
        setValidationError(`Escolha no máximo ${TAG_LIMIT} tags.`);
        return;
      }
      onChange([...selectedTagIds, tag.id]);
      return;
    }

    onChange(selectedTagIds.filter(tagId => tagId !== tag.id));
  };

  const handleCreate = async (event?: FormEvent) => {
    event?.preventDefault();
    setValidationError(null);

    const name = draft.trim();
    if (!name || isMutating) {
      return;
    }
    if (name.length > TAG_NAME_MAX_LENGTH) {
      setValidationError(`A tag deve ter no máximo ${TAG_NAME_MAX_LENGTH} caracteres.`);
      return;
    }

    const existing = tags.find(tag => normalizeTagName(tag.name) === normalizeTagName(name));
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        if (selectedTagIds.length >= TAG_LIMIT) {
          setValidationError(`Escolha no máximo ${TAG_LIMIT} tags.`);
          return;
        }
        onChange([...selectedTagIds, existing.id]);
      }
      setDraft('');
      return;
    }

    if (selectedTagIds.length >= TAG_LIMIT) {
      setValidationError(`Escolha no máximo ${TAG_LIMIT} tags.`);
      return;
    }

    const created = await props.onCreateTag(name);
    if (created) {
      if (!selectedTagIds.includes(created.id)) {
        onChange([...selectedTagIds, created.id]);
      }
      setDraft('');
    }
  };

  const handleDelete = async (tag: Tag) => {
    setValidationError(null);
    const confirmed = window.confirm(`Excluir a tag "${tag.name}" do catálogo? Ela será removida de todas as missões.`);
    if (!confirmed) {
      return;
    }

    const deleted = await props.onDeleteTag(tag);
    if (deleted) {
      onChange(selectedTagIds.filter(tagId => tagId !== tag.id));
    }
  };

  return (
    <fieldset className="min-w-0">
      <legend className="mb-xs font-secondary text-sm font-semibold">Tags (opcional)</legend>

      {selectedTags.length > 0 && (
        <ul aria-label="Tags selecionadas" className="mb-sm flex flex-wrap gap-[6px]">
          {selectedTags.map(tag => (
            <li
              key={tag.id}
              className="border-neutral-soft bg-neutral-xsoft text-tinta-2 flex items-center gap-xs rounded-full border px-[10px] py-[2px] text-sm">
              {tag.name}
              <button
                type="button"
                aria-label={`Remover tag ${tag.name} da missão`}
                title={`Remover tag ${tag.name} da missão`}
                onClick={() => toggleTag(tag, false)}
                className="text-neutral-strong flex items-center hover:brightness-110">
                <FaIcon.Close aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {isLoading && <p className="text-tinta-2 text-sm">Carregando tags...</p>}

      {!isLoading && errorMessage && (
        <p role="alert" className="text-feedback-danger text-sm">
          {errorMessage}
        </p>
      )}

      {!isLoading && !errorMessage && tags.length === 0 && (
        <p className="text-tinta-2 text-sm">Nenhuma tag disponível.</p>
      )}

      {!isLoading && !errorMessage && tags.length > 0 && (
        <ul aria-label="Tags existentes" className="mb-sm max-h-[180px] overflow-y-auto">
          {tags.map(tag => (
            <li key={tag.id} className="flex items-center justify-between gap-sm py-[2px]">
              <label className="flex min-w-0 items-center gap-xs text-sm">
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={event => toggleTag(tag, event.target.checked)}
                />
                <span className="truncate">{tag.name}</span>
              </label>
              <button
                type="button"
                aria-label={`Excluir tag ${tag.name} do catálogo`}
                title={`Excluir tag ${tag.name} do catálogo`}
                onClick={() => handleDelete(tag)}
                disabled={isMutating}
                className="text-feedback-danger text-sm hover:brightness-110 disabled:opacity-60">
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-start gap-xs">
        <div className="flex-1">
          <label htmlFor={id} className="sr-only">
            Criar nova tag
          </label>
          <TextInput
            id={id}
            value={draft}
            onChange={eventOrValue =>
              setDraft(typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value)
            }
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleCreate();
              }
            }}
            maxLength={TAG_NAME_MAX_LENGTH}
            placeholder="Nova tag"
            disabled={isMutating}
          />
        </div>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={isMutating || !draft.trim()}
          className="border-neutral-strong bg-neutral-xsoft text-neutral-strong h-[44px] rounded-[4px] border px-sm font-secondary text-[13px] font-semibold tracking-[0.06em] hover:brightness-110 disabled:opacity-60">
          Criar tag
        </button>
      </div>

      {validationError && (
        <p role="alert" className="text-feedback-danger mt-xs text-sm">
          {validationError}
        </p>
      )}
      {mutationError && (
        <p role="alert" className="text-feedback-danger mt-xs text-sm">
          {mutationError}
        </p>
      )}
    </fieldset>
  );
}
