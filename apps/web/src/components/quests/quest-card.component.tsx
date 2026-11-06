import { FaIcon } from '@atomic/atm.fa-icon';
import type { Quest, QuestStatus } from '@domain/model/quest.model';
import { useState } from 'react';
import { style } from './quest-card.component.style';
import { ADVANCE_LABEL, QUEST_DIFFICULTY_LABEL, formatQuestAge } from './quest-presentation';

interface QuestCardProps {
  quest: Quest;
  columnStatus: QuestStatus;
  onAdvance: (quest: Quest) => void;
  onEdit: (quest: Quest) => void;
  onRemove: (quest: Quest) => void;
}

export function QuestCard(props: QuestCardProps) {
  const { quest, columnStatus, onAdvance, onEdit, onRemove } = props;
  const advanceLabel = ADVANCE_LABEL[columnStatus];
  const classes = style({ columnStatus });
  const [isDragging, setIsDragging] = useState(false);

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <article
      className={classes.card()}
      draggable
      onDragStart={event => {
        event.dataTransfer.setData('text/plain', quest.id);
        event.dataTransfer.setData('application/json', JSON.stringify(quest));
        event.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      style={{ opacity: isDragging ? 0.5 : 1 }}>
      <h3 className={classes.title()}>{quest.title}</h3>
      <p className={classes.description()}>{quest.description}</p>
      <div className={classes.tags()}>
        <span className={classes.difficulty()}>{QUEST_DIFFICULTY_LABEL[quest.difficulty]}</span>
      </div>
      <div className={classes.footer()}>
        <span className={classes.meta()}>
          <FaIcon.StarFull className={classes.xpIcon()} />
          {quest.xpReward} XP
        </span>
        <span className={classes.meta()}>{formatQuestAge(quest.createdAt)}</span>
      </div>
      <div className="flex gap-sm">
        <button type="button" onClick={() => onEdit(quest)} className={classes.editButton()}>
          Editar
        </button>
        <button
          type="button"
          onClick={() => {
            const message =
              quest.status === 'resolved'
                ? `Remover a missão "${quest.title}"? O XP dela (${quest.xpReward} XP) não será descontado da sua pontuação.`
                : `Remover a missão "${quest.title}"?`;
            if (window.confirm(message)) {
              onRemove(quest);
            }
          }}
          className={classes.removeButton()}>
          Remover
        </button>
        {advanceLabel ? (
          <button type="button" onClick={() => onAdvance(quest)} className={classes.advanceButton()}>
            {advanceLabel}
          </button>
        ) : (
          <div className={classes.completed()}>
            <FaIcon.Check className={classes.completedIcon()} />
            Cantada pelos bardos
          </div>
        )}
      </div>
    </article>
  );
}
