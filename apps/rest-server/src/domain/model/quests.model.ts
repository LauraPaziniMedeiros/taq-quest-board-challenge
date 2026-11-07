import type { Tag } from './tags.model.js';

export const QUEST_STATUSES = ['open', 'in_progress', 'resolved'] as const;
export const QUEST_DIFFICULTIES = ['easy', 'normal', 'high'] as const;

export type QuestStatus = (typeof QUEST_STATUSES)[number];
export type QuestDifficulty = (typeof QUEST_DIFFICULTIES)[number];

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  difficulty: QuestDifficulty;
  xpReward: number;
  dueDate: string | null;
  tags: Tag[];
  createdAt: Date;
}

export type QuestData = Omit<Quest, 'xpReward'>;

export interface QuestInput {
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  dueDate?: string | null;
  tagIds?: string[];
}

export interface QuestUpdateInput {
  title?: string;
  description?: string;
  difficulty?: QuestDifficulty;
  status?: QuestStatus;
  dueDate?: string | null;
  tagIds?: string[];
}
