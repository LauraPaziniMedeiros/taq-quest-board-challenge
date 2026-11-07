import { Button } from '@atomic/atm.button';
import { Body } from '@atomic/atm.typography';
import { LoadingCentered } from '@atomic/mol.loading';
import { Col, Grid } from '@atomic/obj.grid';
import {
  QUEST_DIFFICULTIES,
  type Quest,
  type QuestDifficulty,
  type QuestInput,
  type QuestStatus,
  type QuestUpdateInput,
} from '@domain/model/quest.model';
import { useCreateQuest } from '@domain/quests/use-create-quest.use-case';
import { useDeleteQuest } from '@domain/quests/use-delete-quest.use-case';
import { useListQuests } from '@domain/quests/use-list-quests.use-case';
import { useUpdateQuest } from '@domain/quests/use-update-quest.use-case';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreateQuestModal } from './create-quest-modal.component';
import { EditQuestModal } from './edit-quest-modal.component';
import { QuestBoardHeader } from './quest-board-header.component';
import { QuestColumn } from './quest-column.component';
import { QuestPlayerHud } from './quest-player-hud.component';
import { NEXT_STATUS, QUEST_DIFFICULTY_LABEL, QUEST_STATUS_COLUMNS } from './quest-presentation';

const SORT_LABELS: Record<'created_desc' | 'created_asc' | 'xp_desc' | 'xp_asc', string> = {
  created_desc: 'mais recentes',
  created_asc: 'mais antigas',
  xp_desc: 'maior XP',
  xp_asc: 'menor XP',
};

const QuestBoardPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => window.localStorage.getItem('quest-board-theme') === 'dark');
  const {
    quests,
    isLoading,
    error,
    refetch,
    updateQuestInList = () => {},
    removeQuestFromList = () => {},
  } = useListQuests();
  const { createQuest, isLoading: isCreating, error: createError } = useCreateQuest();
  const { updateQuest, isLoading: isUpdating, error: updateError } = useUpdateQuest();
  const { deleteQuest, error: deleteError } = useDeleteQuest();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [announcement, setAnnouncement] = useState({ id: 0, message: '' });
  const [selectedDifficulties, setSelectedDifficulties] = useState<QuestDifficulty[]>([]);
  const [sortModes, setSortModes] = useState<
    Record<QuestStatus, 'created_desc' | 'created_asc' | 'xp_desc' | 'xp_asc'>
  >({
    open: 'created_desc',
    in_progress: 'created_desc',
    resolved: 'created_desc',
  });
  // Only the first load replaces the board with a spinner; refetches keep the current columns on screen.
  const isInitialLoading = isLoading && quests.length === 0;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    window.localStorage.setItem('quest-board-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const announce = useCallback((message: string) => {
    setAnnouncement(previous => ({ id: previous.id + 1, message }));
  }, []);

  const announceQuestMove = useCallback(
    (quest: Quest, status: QuestStatus, succeeded: boolean) => {
      const destination = QUEST_STATUS_COLUMNS.find(column => column.status === status);
      const columnName = destination?.title ?? status;
      announce(
        succeeded
          ? `${quest.title} movida para ${columnName}.`
          : `Falha ao mover ${quest.title} para ${columnName}. Tente novamente.`,
      );
    },
    [announce],
  );

  const handleSortChange = useCallback(
    (status: QuestStatus, mode: 'created_desc' | 'created_asc' | 'xp_desc' | 'xp_asc') => {
      setSortModes(previous => ({ ...previous, [status]: mode }));
      const column = QUEST_STATUS_COLUMNS.find(item => item.status === status);
      announce(`Coluna ${column?.title ?? status} ordenada por ${SORT_LABELS[mode]}.`);
    },
    [announce],
  );

  const handleDifficultyFilterChange = useCallback(
    (difficulty: QuestDifficulty, checked: boolean) => {
      const nextDifficulties = checked
        ? [...selectedDifficulties, difficulty]
        : selectedDifficulties.filter(item => item !== difficulty);

      setSelectedDifficulties(nextDifficulties);
      const visibleCount =
        nextDifficulties.length === 0
          ? quests.length
          : quests.filter(quest => nextDifficulties.includes(quest.difficulty)).length;

      announce(
        nextDifficulties.length === 0
          ? `Filtro removido. Mostrando ${visibleCount} missões.`
          : `Filtro de dificuldade aplicado: ${nextDifficulties
              .map(item => QUEST_DIFFICULTY_LABEL[item])
              .join(', ')}. Mostrando ${visibleCount} missões.`,
      );
    },
    [announce, quests, selectedDifficulties],
  );

  const handleAdvance = useCallback(
    async (quest: Quest) => {
      const next = NEXT_STATUS[quest.status];
      if (!next) {
        return;
      }

      const previousQuest = quest;
      const optimisticQuest = { ...quest, status: next };
      updateQuestInList(optimisticQuest);

      let updated: Quest | null = null;
      try {
        updated = await updateQuest(quest.id, { status: next });
      } catch {
        updated = null;
      }

      if (updated) {
        updateQuestInList(updated);
        announceQuestMove(quest, next, true);
      } else {
        updateQuestInList(previousQuest);
        announceQuestMove(quest, next, false);
      }
    },
    [announceQuestMove, updateQuest, updateQuestInList],
  );

  const handleMoveQuest = useCallback(
    async (quest: Quest, newStatus: QuestStatus) => {
      if (quest.status === newStatus) {
        return;
      }

      const statusOrder: QuestStatus[] = ['open', 'in_progress', 'resolved'];
      if (statusOrder.indexOf(newStatus) <= statusOrder.indexOf(quest.status)) {
        return;
      }

      const previousQuest = quest;
      const optimisticQuest = { ...quest, status: newStatus };
      updateQuestInList(optimisticQuest);

      let updated: Quest | null = null;
      try {
        updated = await updateQuest(quest.id, { status: newStatus });
      } catch {
        updated = null;
      }

      if (updated) {
        updateQuestInList(updated);
        announceQuestMove(quest, newStatus, true);
      } else {
        updateQuestInList(previousQuest);
        announceQuestMove(quest, newStatus, false);
      }
    },
    [announceQuestMove, updateQuest, updateQuestInList],
  );

  const visibleQuests = useMemo(
    () =>
      selectedDifficulties.length === 0
        ? quests
        : quests.filter(quest => selectedDifficulties.includes(quest.difficulty)),
    [quests, selectedDifficulties],
  );

  const columns = useMemo(
    () =>
      QUEST_STATUS_COLUMNS.map(column => {
        const columnQuests = visibleQuests.filter(quest => quest.status === column.status);
        const sortedQuests = [...columnQuests].sort((first, second) => {
          switch (sortModes[column.status]) {
            case 'created_asc':
              return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
            case 'xp_desc':
              return second.xpReward - first.xpReward;
            case 'xp_asc':
              return first.xpReward - second.xpReward;
            case 'created_desc':
            default:
              return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
          }
        });

        return { ...column, quests: sortedQuests };
      }),
    [visibleQuests, sortModes],
  );

  const handleCreateQuest = async (input: QuestInput) => {
    const created = await createQuest(input);
    if (created) {
      setIsCreateModalOpen(false);
      refetch();
      announce(`Missão "${created.title}" criada.`);
    }
    return Boolean(created);
  };

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
  };

  const handleDuplicateQuest = async (quest: Quest) => {
    const created = await createQuest({
      title: quest.title,
      description: quest.description,
      difficulty: quest.difficulty,
    });

    if (created) {
      refetch();
      setEditingQuest(created);
      announce(`Cópia de "${quest.title}" criada. Modal de edição aberto.`);
    } else {
      announce(`Falha ao duplicar "${quest.title}". Tente novamente.`);
    }
  };

  const handleRemoveQuest = async (quest: Quest) => {
    const deleted = await deleteQuest(quest.id);
    if (deleted) {
      removeQuestFromList(quest.id);
      announce(
        quest.status === 'resolved'
          ? `"${quest.title}" removida. O XP dela não será mais contado no quadro.`
          : `"${quest.title}" removida.`,
      );
    } else {
      announce(`Falha ao remover "${quest.title}". Tente novamente.`);
    }
  };

  const handleUpdateQuest = async (input: QuestUpdateInput) => {
    if (!editingQuest) {
      return false;
    }

    const updated = await updateQuest(editingQuest.id, input);
    if (updated) {
      const updatedTitle = updated.title;
      setEditingQuest(null);
      refetch();
      announce(`Missão "${updatedTitle}" atualizada.`);
    }
    return Boolean(updated);
  };

  return (
    <Grid className="max-w-[1100px] py-lg">
      <output key={announcement.id} className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement.message}
      </output>
      <Col sm={12} className="mb-lg">
        <QuestBoardHeader
          onCreateClick={() => setIsCreateModalOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(previous => !previous)}
        />
      </Col>

      <Col sm={12} className="mb-lg">
        <QuestPlayerHud quests={quests} />
      </Col>

      {isInitialLoading && (
        <Col sm={12}>
          <LoadingCentered />
        </Col>
      )}

      {!isLoading && error && (
        <Col sm={12} className="text-center">
          <Body role="alert">{error.message}</Body>
          <Button variant="secondary" onClick={refetch} className="mt-md">
            Tentar de novo
          </Button>
        </Col>
      )}

      {!isInitialLoading && !error && (
        <>
          <Col sm={12} className="mb-md">
            <fieldset className="flex flex-wrap items-center gap-sm">
              <legend className="mr-sm font-secondary text-sm font-semibold">Filtrar por dificuldade</legend>
              {QUEST_DIFFICULTIES.map(difficulty => (
                <label key={difficulty} className="flex items-center gap-xs text-sm">
                  <input
                    type="checkbox"
                    checked={selectedDifficulties.includes(difficulty)}
                    onChange={event => handleDifficultyFilterChange(difficulty, event.target.checked)}
                  />
                  {QUEST_DIFFICULTY_LABEL[difficulty]}
                </label>
              ))}
            </fieldset>
          </Col>
          <Col sm={12}>
            <div className="grid grid-cols-3 items-start gap-[18px]">
              {columns.map(column => (
                <QuestColumn
                  key={column.status}
                  status={column.status}
                  title={column.title}
                  subtitle={column.subtitle}
                  quests={column.quests}
                  onAdvance={handleAdvance}
                  onEdit={handleEditQuest}
                  onMoveQuest={handleMoveQuest}
                  onRemove={handleRemoveQuest}
                  onDuplicate={handleDuplicateQuest}
                  sortMode={sortModes[column.status]}
                  onSortChange={mode => handleSortChange(column.status, mode)}
                />
              ))}
            </div>
          </Col>
        </>
      )}

      {updateError && (
        <Col sm={12} className="text-center">
          <Body role="alert">{updateError.message}</Body>
        </Col>
      )}

      {deleteError && (
        <Col sm={12} className="text-center">
          <Body role="alert">{deleteError.message}</Body>
        </Col>
      )}

      <CreateQuestModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateQuest}
        isLoading={isCreating}
        errorMessage={createError?.message}
      />

      <EditQuestModal
        opened={editingQuest !== null}
        quest={editingQuest}
        onClose={() => setEditingQuest(null)}
        onSubmit={handleUpdateQuest}
        isLoading={isUpdating}
        errorMessage={updateError?.message}
      />
    </Grid>
  );
};

export default QuestBoardPage;
