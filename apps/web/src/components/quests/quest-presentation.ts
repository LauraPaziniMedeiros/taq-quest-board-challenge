import type { Quest, QuestDifficulty, QuestStatus } from '@domain/model/quest.model';
import { format, formatDistanceToNow, isBefore, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export const QUEST_STATUS_COLUMNS: Array<{ status: QuestStatus; title: string; subtitle: string }> = [
  { status: 'open', title: 'Pergaminhos Novos', subtitle: 'À espera de um campeão' },
  { status: 'in_progress', title: 'Em Jornada', subtitle: 'Heróis na estrada' },
  { status: 'resolved', title: 'Lendas Concluídas', subtitle: 'Já nas canções' },
];

export const QUEST_DIFFICULTY_LABEL: Record<QuestDifficulty, string> = {
  easy: 'Fácil',
  normal: 'Normal',
  high: 'Difícil',
};

export const NEXT_STATUS: Partial<Record<QuestStatus, QuestStatus>> = {
  open: 'in_progress',
  in_progress: 'resolved',
};

export const ADVANCE_LABEL: Partial<Record<QuestStatus, string>> = {
  open: 'Aceitar missão',
  in_progress: 'Selar a vitória',
};

export function formatQuestAge(createdAt: string): string {
  return `Aberta há ${formatDistanceToNow(new Date(createdAt), { locale: ptBR })}`;
}

const BRAZILIAN_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function formatQuestDueDate(dueDate: string): string {
  return format(parseISO(dueDate), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDueDateInput(isoDate: string | null): string {
  if (!isoDate) {
    return '';
  }

  return formatQuestDueDate(isoDate);
}

export function parseDueDateInput(value: string): string | null {
  const match = BRAZILIAN_DATE_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const [, dayValue, monthValue, yearValue] = match;
  const day = Number(dayValue);
  const month = Number(monthValue);
  const year = Number(yearValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return `${yearValue}-${monthValue}-${dayValue}`;
}

export function isQuestPastDue(quest: Pick<Quest, 'dueDate' | 'status'>, now = new Date()): boolean {
  if (!quest.dueDate || quest.status === 'resolved') {
    return false;
  }

  return isBefore(parseISO(quest.dueDate), startOfDay(now));
}

export const LEVEL_TITLE_REQUIREMENTS = [
  { requiredLevel: 1, title: 'Recruta' },
  { requiredLevel: 2, title: 'Aventureiro' },
  { requiredLevel: 3, title: 'Herói' },
  { requiredLevel: 4, title: 'Lenda' },
] as const;

export const LEVEL_TITLES = LEVEL_TITLE_REQUIREMENTS.map(({ title }) => title);

export function getLevelTitle(level: number): string {
  const applicableTitles = LEVEL_TITLE_REQUIREMENTS.filter(({ requiredLevel }) => level >= requiredLevel).sort(
    (first, second) => first.requiredLevel - second.requiredLevel,
  );

  return applicableTitles[applicableTitles.length - 1]?.title ?? LEVEL_TITLE_REQUIREMENTS[0]?.title ?? 'Recruta';
}
