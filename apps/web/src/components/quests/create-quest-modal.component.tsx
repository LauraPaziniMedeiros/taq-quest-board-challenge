import { Button } from '@atomic/atm.button';
import { Select } from '@atomic/atm.select';
import { TextAreaInput, TextInput } from '@atomic/atm.text-input';
import { InputLabel } from '@atomic/atm.typography';
import { Col, Grid } from '@atomic/obj.grid';
import { Modal } from '@atomic/obj.modal';
import { QUEST_DIFFICULTIES, type QuestDifficulty, type QuestInput } from '@domain/model/quest.model';
import type { Tag } from '@domain/model/tag.model';
import { type FormEvent, useRef, useState } from 'react';
import { QuestDueDateInput } from './quest-due-date-input.component';
import { QUEST_DIFFICULTY_LABEL, parseDueDateInput } from './quest-presentation';
import { QuestTagsField } from './quest-tags-field.component';

const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 5000;
const TITLE_REQUIRED_MESSAGE = 'Informe o título da missão.';
const DESCRIPTION_REQUIRED_MESSAGE = 'Informe a descrição da missão.';
const DUE_DATE_INVALID_MESSAGE = 'Informe uma data válida (dd/mm/aaaa).';
const DIFFICULTY_OPTIONS = QUEST_DIFFICULTIES.map(value => ({ value, label: QUEST_DIFFICULTY_LABEL[value] }));

interface CreateQuestModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (input: QuestInput) => Promise<boolean>;
  isLoading: boolean;
  errorMessage?: string | null;
  tags: Tag[];
  tagsLoading: boolean;
  tagsError?: string | null;
  isTagMutating: boolean;
  tagMutationError?: string | null;
  onCreateTag: (name: string) => Promise<Tag | null>;
  onDeleteTag: (tag: Tag) => Promise<boolean>;
}

export function CreateQuestModal(props: CreateQuestModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('normal');
  const [dueDate, setDueDate] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);

  // Errors only show after a submit attempt, so an untouched form doesn't open already flagged.
  const titleError = submitAttempted && !title.trim() ? TITLE_REQUIRED_MESSAGE : undefined;
  const descriptionError = submitAttempted && !description.trim() ? DESCRIPTION_REQUIRED_MESSAGE : undefined;
  const dueDateError =
    submitAttempted && dueDate.trim() && !parseDueDateInput(dueDate) ? DUE_DATE_INVALID_MESSAGE : undefined;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    if (!description.trim()) {
      descriptionRef.current?.focus();
      return;
    }
    if (dueDate.trim() && !parseDueDateInput(dueDate)) {
      dueDateRef.current?.focus();
      return;
    }
    if (props.isLoading || props.isTagMutating) {
      return;
    }

    const succeeded = await props.onSubmit({
      title: title.trim(),
      description: description.trim(),
      difficulty,
      dueDate: dueDate.trim() ? parseDueDateInput(dueDate) : null,
      tagIds: selectedTagIds,
    });
    if (succeeded) {
      setTitle('');
      setDescription('');
      setDifficulty('normal');
      setDueDate('');
      setSelectedTagIds([]);
      setSubmitAttempted(false);
    }
  };

  const handleClose = () => {
    setSubmitAttempted(false);
    props.onClose();
  };

  return (
    <Modal opened={props.opened} onClose={handleClose} title="Nova missão" small>
      <form onSubmit={handleSubmit} noValidate>
        <Grid>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="quest-title">Título da missão</InputLabel>
            <TextInput
              ref={titleRef}
              id="quest-title"
              value={title}
              onChange={eventOrValue =>
                setTitle(typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value)
              }
              maxLength={TITLE_MAX_LENGTH}
              placeholder="Enfrentar o dragão"
              required
              invalid={!!titleError}
              aria-invalid={!!titleError}
              aria-describedby={titleError ? 'quest-title-error' : undefined}
            />
            {titleError && (
              <p id="quest-title-error" className="text-feedback-danger mt-xs text-sm">
                {titleError}
              </p>
            )}
          </Col>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="quest-description">Descrição</InputLabel>
            <TextAreaInput
              ref={descriptionRef}
              id="quest-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              maxLength={DESCRIPTION_MAX_LENGTH}
              rows={4}
              placeholder="Derrote a fera nas montanhas ao norte e traga prova da vitória."
              required
              invalid={!!descriptionError}
              aria-invalid={!!descriptionError}
              aria-describedby={descriptionError ? 'quest-description-error' : undefined}
            />
            {descriptionError && (
              <p id="quest-description-error" className="text-feedback-danger mt-xs text-sm">
                {descriptionError}
              </p>
            )}
          </Col>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="quest-difficulty">Dificuldade</InputLabel>
            <Select
              id="quest-difficulty"
              value={difficulty}
              onChange={event => setDifficulty(event.target.value as QuestDifficulty)}
              options={DIFFICULTY_OPTIONS}
            />
          </Col>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="quest-due-date">Prazo (opcional)</InputLabel>
            <QuestDueDateInput
              ref={dueDateRef}
              id="quest-due-date"
              value={dueDate}
              onChange={setDueDate}
              invalid={!!dueDateError}
              describedBy={dueDateError ? 'quest-due-date-error' : undefined}
            />
            {dueDateError && (
              <p id="quest-due-date-error" className="text-feedback-danger mt-xs text-sm">
                {dueDateError}
              </p>
            )}
          </Col>
          <Col sm={12} className="mb-md">
            <QuestTagsField
              id="quest-tags"
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
              tags={props.tags}
              isLoading={props.tagsLoading}
              errorMessage={props.tagsError}
              isMutating={props.isTagMutating}
              mutationError={props.tagMutationError}
              onCreateTag={props.onCreateTag}
              onDeleteTag={props.onDeleteTag}
            />
          </Col>
          <Col sm={12}>
            <Button type="submit" variant="cta" expanded loading={props.isLoading}>
              Publicar missão
            </Button>
          </Col>
          {props.errorMessage && (
            <Col sm={12} className="mt-sm">
              <p role="alert" className="text-feedback-danger text-sm">
                {props.errorMessage}
              </p>
            </Col>
          )}
        </Grid>
      </form>
    </Modal>
  );
}
