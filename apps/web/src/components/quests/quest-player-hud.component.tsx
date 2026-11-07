import type { Quest } from '@domain/model/quest.model';
import { useEffect, useRef, useState } from 'react';
import { getLevelTitle } from './quest-presentation';

interface QuestPlayerHudProps {
  quests?: Quest[];
  totalXp?: number;
}

export function calculatePlayerProgress(quests: Quest[] = [], totalXp?: number) {
  const resolvedXp =
    totalXp ?? quests.filter(quest => quest.status === 'resolved').reduce((sum, quest) => sum + quest.xpReward, 0);

  return {
    totalXp: resolvedXp,
    level: Math.floor(resolvedXp / 100) + 1,
    currentLevelXp: resolvedXp % 100,
  };
}

export { getLevelTitle } from './quest-presentation';

export const QuestPlayerHud = ({ quests, totalXp }: QuestPlayerHudProps = {}) => {
  const { level, currentLevelXp } = calculatePlayerProgress(quests ?? [], totalXp);
  const levelTitle = getLevelTitle(level);
  const previousLevelRef = useRef(level);
  const [celebrationLevel, setCelebrationLevel] = useState<number | null>(null);

  useEffect(() => {
    if (level > previousLevelRef.current) {
      setCelebrationLevel(level);
      const timeout = window.setTimeout(() => setCelebrationLevel(null), 3000);
      previousLevelRef.current = level;
      return () => window.clearTimeout(timeout);
    }

    previousLevelRef.current = level;
    return undefined;
  }, [level]);

  return (
    <div
      className="flex flex-wrap items-center gap-x-[28px] gap-y-[20px] rounded-[6px] border px-[22px] py-[16px]"
      style={{
        background: 'var(--quest-hud-background)',
        borderColor: 'var(--color-primary-strong)',
        color: 'var(--ficha-texto)',
        boxShadow: 'inset 0 0 0 4px var(--quest-hud-background), inset 0 0 0 5px var(--ficha-borda)',
      }}>
      <div className="flex items-center gap-[14px]">
        <div
          className="font-secondary flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 text-[18px] font-bold"
          style={{
            background: 'var(--color-cta-medium)',
            borderColor: 'var(--color-primary-medium)',
            color: 'var(--avatar-texto)',
          }}>
          {levelTitle.charAt(0)}
        </div>
        <div>
          <div className="font-secondary text-[19px] font-bold" style={{ color: 'var(--ficha-nome)' }}>
            {levelTitle}
          </div>
          <div className="text-[15px] italic" style={{ color: 'var(--ficha-apoio)' }}>
            {levelTitle} da Guilda Taqtile · Nível {level}
          </div>
        </div>
      </div>

      {celebrationLevel !== null && (
        <div
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="status"
          className="font-secondary animate-bounce rounded-[6px] border px-[12px] py-[8px] text-[14px] font-bold"
          style={{
            background: 'var(--color-cta-medium)',
            borderColor: 'var(--color-primary-medium)',
            color: 'var(--avatar-texto)',
          }}>
          Parabéns! Você alcançou o nível {celebrationLevel}: {getLevelTitle(celebrationLevel)}!
        </div>
      )}

      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-[6px]">
        <div className="flex justify-between text-[15px]" style={{ color: 'var(--ficha-xp-rotulo)' }}>
          <span>Experiência</span>
          <span className="font-secondary text-[13px]" style={{ color: 'var(--color-primary-soft)' }}>
            {currentLevelXp} / 100 XP
          </span>
        </div>
        <div
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
          role="progressbar"
          aria-label="Experiência até o próximo nível"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={currentLevelXp}
          className="quest-xp-progress bg-[var(--ficha-xp-trilho)] h-[12px] overflow-hidden rounded-[6px] border"
          style={{ borderColor: 'var(--ficha-borda)' }}>
          <div className="h-full" style={{ width: `${currentLevelXp}%`, background: 'var(--color-primary-medium)' }} />
        </div>
      </div>
    </div>
  );
};
