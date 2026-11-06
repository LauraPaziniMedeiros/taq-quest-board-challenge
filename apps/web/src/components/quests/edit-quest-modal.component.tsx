import { Button } from '@atomic/atm.button';
import { Select } from '@atomic/atm.select';
import { TextAreaInput, TextInput } from '@atomic/atm.text-input';
import { InputLabel } from '@atomic/atm.typography';
import { Col, Grid } from '@atomic/obj.grid';
import { Modal } from '@atomic/obj.modal';
import { QUEST_DIFFICULTIES, type Quest, type QuestDifficulty, type QuestUpdateInput } from '@domain/model/quest.model';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { QUEST_DIFFICULTY_LABEL } from './quest-presentation';

const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 5000;
const TITLE_REQUIRED_MESSAGE = 'Informe o título da missão.';
const DESCRIPTION_REQUIRED_MESSAGE = 'Informe a descrição da missão.';
const DIFFICULTY_OPTIONS = QUEST_DIFFICULTIES.map(value => ({ value, label: QUEST_DIFFICULTY_LABEL[value] }));

interface EditQuestModalProps {
  opened: boolean;
  quest: Quest | null;
  onClose: () => void;
  onSubmit: (input: QuestUpdateInput) => Promise<boolean>;
  isLoading: boolean;
  errorMessage?: string | null;
}

export function EditQuestModal(props: EditQuestModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('normal');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (props.quest && props.opened) {
      setTitle(props.quest.title);
      setDescription(props.quest.description);
      setDifficulty(props.quest.difficulty);
      setSubmitAttempted(false);
    }
  }, [props.quest, props.opened]);

  const titleError = submitAttempted && !title.trim() ? TITLE_REQUIRED_MESSAGE : undefined;
  const descriptionError = submitAttempted && !description.trim() ? DESCRIPTION_REQUIRED_MESSAGE : undefined;

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
    if (props.isLoading || !props.quest) {
      return;
    }

    const changes: QuestUpdateInput = {};
    if (title.trim() !== props.quest.title) {
      changes.title = title.trim();
    }
    if (description.trim() !== props.quest.description) {
      changes.description = description.trim();
    }
    if (difficulty !== props.quest.difficulty) {
      changes.difficulty = difficulty;
    }

    const succeeded = await props.onSubmit(changes);
    if (succeeded) {
      setSubmitAttempted(false);
    }
  };

  const handleClose = () => {
    setSubmitAttempted(false);
    props.onClose();
  };

  return (
    <Modal opened={props.opened} onClose={handleClose} title="Editar missão" small>
      <form onSubmit={handleSubmit} noValidate>
        <Grid>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="quest-edit-title">Título da missão</InputLabel>
            <TextInput
              ref={titleRef}
              id="quest-edit-title"
              value={title}
              onChange={eventOrValue =>
                setTitle(typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value)
              }
              maxLength={TITLE_MAX_LENGTH}
              required
              invalid={!!titleError}
              aria-invalid={!!titleError}
              aria-describedby={titleError ? 'quest-edit-title-error' : undefined}
            />
            {titleError && (
              <p id="quest-edit-title-error" className="text-feedback-danger mt-xs text-sm">
                {titleError}
              </p>
            )}
          </Col>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="quest-edit-description">Descrição</InputLabel>
            <TextAreaInput
              ref={descriptionRef}
              id="quest-edit-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              maxLength={DESCRIPTION_MAX_LENGTH}
              rows={4}
              required
              invalid={!!descriptionError}
              aria-invalid={!!descriptionError}
              aria-describedby={descriptionError ? 'quest-edit-description-error' : undefined}
            />
            {descriptionError && (
              <p id="quest-edit-description-error" className="text-feedback-danger mt-xs text-sm">
                {descriptionError}
              </p>
            )}
          </Col>
          <Col sm={12} className="mb-md">
            <InputLabel htmlFor="quest-edit-difficulty">Dificuldade</InputLabel>
            <Select
              id="quest-edit-difficulty"
              value={difficulty}
              onChange={event => setDifficulty(event.target.value as QuestDifficulty)}
              options={DIFFICULTY_OPTIONS}
            />
          </Col>
          <Col sm={12}>
            <Button type="submit" variant="cta" expanded loading={props.isLoading}>
              Salvar alterações
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
