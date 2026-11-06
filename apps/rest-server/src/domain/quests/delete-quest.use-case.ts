import { NotFoundError } from '@repo/core/error';
import { QuestsDbDatasource } from '#data/quests/quests.db.datasource.js';
import type { Quest } from '#domain/model/quests.model.js';
import { QuestErrors } from './quests.error.js';
import { withXpReward } from './quests.utils.js';

export const DeleteQuestUseCase = {
  async exec(id: string): Promise<Quest> {
    const existing = await QuestsDbDatasource.findOneById(id);
    if (!existing) {
      throw new NotFoundError(QuestErrors.NotFound);
    }

    const deleted = await QuestsDbDatasource.delete(id);
    if (!deleted) {
      throw new NotFoundError(QuestErrors.NotFound);
    }

    return withXpReward(deleted);
  },
};
