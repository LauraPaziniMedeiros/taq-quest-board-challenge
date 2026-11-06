import type { Quest, QuestStatus } from '@domain/model/quest.model';
import type { DragEvent } from 'react';
import { useState } from 'react';
import { QuestCard } from './quest-card.component';

const QUEST_STATUS_ORDER: QuestStatus[] = ['open', 'in_progress', 'resolved'];

interface QuestColumnProps {
  status: QuestStatus;
  title: string;
  subtitle: string;
  quests: Quest[];
  onAdvance: (quest: Quest) => void;
  onEdit: (quest: Quest) => void;
  onMoveQuest: (quest: Quest, status: QuestStatus) => void;
}

export const QuestColumn = ({ status, title, subtitle, quests, onAdvance, onEdit, onMoveQuest }: QuestColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    let quest: Quest | null = null;
    const serializedQuest = event.dataTransfer.getData('application/json');
    if (serializedQuest) {
      try {
        quest = JSON.parse(serializedQuest) as Quest;
      } catch {
        quest = null;
      }
    }

    if (!quest) {
      const questId = event.dataTransfer.getData('text/plain');
      quest = quests.find(item => item.id === questId) ?? null;
    }

    if (quest) {
      const currentIndex = QUEST_STATUS_ORDER.indexOf(quest.status);
      const targetIndex = QUEST_STATUS_ORDER.indexOf(status);
      if (targetIndex > currentIndex) {
        onMoveQuest(quest, status);
      }
    }
  };

  return (
    <section
      className="border-background-strong flex flex-col rounded-[6px] border"
      style={{
        background: isDragOver ? 'var(--color-primary-soft)' : 'var(--pergaminho-coluna)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}>
      <div className="border-background-strong flex items-center justify-between gap-sm border-b px-[16px] pt-[14px] pb-[12px]">
        <div>
          <h2 className="font-secondary text-neutral-strong m-0 text-[16px] font-bold tracking-[0.04em]">{title}</h2>
          <span className="text-[14px] italic" style={{ color: 'var(--tinta-3)' }}>
            {subtitle}
          </span>
        </div>
        <span
          className="font-secondary flex h-[28px] min-w-[28px] items-center justify-center rounded-full px-sm text-[13px] font-bold"
          style={{ background: 'var(--color-neutral-strong)', color: 'var(--color-primary-soft)' }}>
          {quests.length}
        </span>
      </div>

      <div className="flex flex-col gap-[12px] p-[12px]">
        {quests.length === 0 && (
          <div
            className="border-background-strong rounded-[4px] border border-dashed p-[24px_12px] text-center text-[16px] italic"
            style={{ color: 'var(--tinta-3)' }}>
            Nenhum pergaminho aqui.
          </div>
        )}
        {quests.map(quest => (
          <QuestCard key={quest.id} quest={quest} columnStatus={status} onAdvance={onAdvance} onEdit={onEdit} />
        ))}
      </div>
    </section>
  );
};
