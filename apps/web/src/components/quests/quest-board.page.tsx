import { Button } from '@atomic/atm.button';
import { Body } from '@atomic/atm.typography';
import { LoadingCentered } from '@atomic/mol.loading';
import { Col, Grid } from '@atomic/obj.grid';
import type { Quest, QuestInput, QuestStatus, QuestUpdateInput } from '@domain/model/quest.model';
import { useCreateQuest } from '@domain/quests/use-create-quest.use-case';
import { useDeleteQuest } from '@domain/quests/use-delete-quest.use-case';
import { useListQuests } from '@domain/quests/use-list-quests.use-case';
import { useUpdateQuest } from '@domain/quests/use-update-quest.use-case';
import { useCallback, useMemo, useState } from 'react';
import { CreateQuestModal } from './create-quest-modal.component';
import { EditQuestModal } from './edit-quest-modal.component';
import { QuestBoardHeader } from './quest-board-header.component';
import { QuestColumn } from './quest-column.component';
import { QuestPlayerHud } from './quest-player-hud.component';
import { NEXT_STATUS, QUEST_STATUS_COLUMNS } from './quest-presentation';

const QuestBoardPage = () => {
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
  // Only the first load replaces the board with a spinner; refetches keep the current columns on screen.
  const isInitialLoading = isLoading && quests.length === 0;

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
      } else {
        updateQuestInList(previousQuest);
      }
    },
    [updateQuest, updateQuestInList],
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
      } else {
        updateQuestInList(previousQuest);
      }
    },
    [updateQuest, updateQuestInList],
  );

  const columns = useMemo(
    () =>
      QUEST_STATUS_COLUMNS.map(column => ({
        ...column,
        quests: quests.filter(quest => quest.status === column.status),
      })),
    [quests],
  );

  const handleCreateQuest = async (input: QuestInput) => {
    const created = await createQuest(input);
    if (created) {
      setIsCreateModalOpen(false);
      refetch();
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
    }
  };

  const handleRemoveQuest = async (quest: Quest) => {
    const deleted = await deleteQuest(quest.id);
    console.log('deleted', deleted);
    if (deleted) {
      removeQuestFromList(quest.id);
    }
  };

  const handleUpdateQuest = async (input: QuestUpdateInput) => {
    if (!editingQuest) {
      return false;
    }

    const updated = await updateQuest(editingQuest.id, input);
    if (updated) {
      setEditingQuest(null);
      refetch();
    }
    return Boolean(updated);
  };

  return (
    <Grid className="max-w-[1100px] py-lg">
      <Col sm={12} className="mb-lg">
        <QuestBoardHeader onCreateClick={() => setIsCreateModalOpen(true)} />
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
              />
            ))}
          </div>
        </Col>
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
