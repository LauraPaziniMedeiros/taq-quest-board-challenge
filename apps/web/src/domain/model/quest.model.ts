export type QuestStatus = 'open' | 'in_progress' | 'resolved';
export const QUEST_DIFFICULTIES = ['easy', 'normal', 'high'] as const;
export type QuestDifficulty = (typeof QUEST_DIFFICULTIES)[number];

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  difficulty: QuestDifficulty;
  xpReward: number;
  createdAt: string;
}

export interface QuestInput {
  title: string;
  description: string;
  difficulty: QuestDifficulty;
}

export interface QuestUpdateInput {
  title?: string;
  description?: string;
  difficulty?: QuestDifficulty;
  status?: QuestStatus;
}

export interface PageInfo {
  limit: number;
  offset: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  nodes: T[];
  count: number;
  pageInfo: PageInfo;
}
