import { NotFoundError } from '@repo/core/error';
import { QuestsDbDatasource } from '#data/quests/quests.db.datasource.js';
import type { Quest, QuestUpdateInput } from '#domain/model/quests.model.js';
import { QuestErrors } from './quests.error.js';
import { withXpReward } from './quests.utils.js';

export const UpdateQuestUseCase = {
  async exec(id: string, input: QuestUpdateInput): Promise<Quest> {
    const existing = await QuestsDbDatasource.findOneById(id);
    if (!existing) {
      throw new NotFoundError(QuestErrors.NotFound);
    }

    const updated = await QuestsDbDatasource.update(id, input);
    if (!updated) {
      throw new NotFoundError(QuestErrors.NotFound);
    }

    return withXpReward(updated);
  },
};
