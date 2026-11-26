import type { AchievementDef, PlayerProfile } from '../types/game';
import { TOTAL_LEVELS } from '../engine/mazeGenerator';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_escape',
    title: 'First Escape',
    description: 'Complete your first level and outrun the cat.',
    icon: '🏆',
    xpBonus: 50,
    coinBonus: 25,
  },
  {
    id: 'cheese_hunter',
    title: 'Cheese Hunter',
    description: 'Collect 10 slices of cheese across your runs.',
    icon: '🧀',
    xpBonus: 75,
    coinBonus: 40,
  },
  {
    id: 'survivor',
    title: 'Survivor',
    description: 'Win three games against the paranoid maze.',
    icon: '🛡️',
    xpBonus: 100,
    coinBonus: 50,
  },
  {
    id: 'speed_rat',
    title: 'Speed Rat',
    description: 'Complete any level under its target par time.',
    icon: '⚡',
    xpBonus: 100,
    coinBonus: 60,
  },
  {
    id: 'ghost_dodger',
    title: 'Ghost Dodger',
    description: 'Escape a level after encountering the haunting Ghost.',
    icon: '👻',
    xpBonus: 80,
    coinBonus: 45,
  },
  {
    id: 'perfect_run',
    title: 'Perfect Run',
    description: 'Complete a level after collecting every cheese slice in the sector.',
    icon: '💎',
    xpBonus: 120,
    coinBonus: 75,
  },
  {
    id: 'maze_master',
    title: 'Maze Conqueror',
    description: 'Complete all 5 progression levels.',
    icon: '👑',
    xpBonus: 300,
    coinBonus: 200,
  },
];

export interface VictoryContext {
  level: number;
  timeSeconds: number;
  targetTimeSeconds: number;
  ghostEncountered: boolean;
  collectedAllCheeseInLevel: boolean;
}

export function evaluateAchievements(
  player: PlayerProfile,
  victoryCtx?: VictoryContext
): { newlyUnlocked: AchievementDef[]; bonusXp: number; bonusCoins: number } {
  const already = new Set(player.achievements);
  const newlyUnlocked: AchievementDef[] = [];

  const checkAndAdd = (id: string, condition: boolean) => {
    if (!already.has(id) && condition) {
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) {
        already.add(id);
        newlyUnlocked.push(def);
      }
    }
  };

  checkAndAdd('first_escape', player.totalWins >= 1 || player.completedLevels.length >= 1);
  checkAndAdd('cheese_hunter', player.cheeseCollected >= 10);
  checkAndAdd('survivor', player.totalWins >= 3);
  checkAndAdd('maze_master', player.completedLevels.length >= TOTAL_LEVELS);

  if (victoryCtx) {
    checkAndAdd('speed_rat', victoryCtx.timeSeconds <= victoryCtx.targetTimeSeconds);
    checkAndAdd('ghost_dodger', victoryCtx.ghostEncountered);
    checkAndAdd('perfect_run', victoryCtx.collectedAllCheeseInLevel);
  }

  const bonusXp = newlyUnlocked.reduce((sum, a) => sum + a.xpBonus, 0);
  const bonusCoins = newlyUnlocked.reduce((sum, a) => sum + a.coinBonus, 0);

  return { newlyUnlocked, bonusXp, bonusCoins };
}

export interface RankInfo {
  rank: string;
  tier: number;
  nextRank: string | null;
  currentMinXp: number;
  nextMinXp: number | null;
  progressPercent: number;
}

const RANK_TIERS = [
  { rank: 'Rookie Squeak', minXp: 0 },
  { rank: 'Tunnel Runner', minXp: 200 },
  { rank: 'Cheese Phantom', minXp: 500 },
  { rank: 'Shadow Whisker', minXp: 1000 },
  { rank: 'Maze Overlord', minXp: 2000 },
];

export function getPlayerRank(xp: number): RankInfo {
  let idx = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (xp >= RANK_TIERS[i].minXp) {
      idx = i;
    }
  }

  const current = RANK_TIERS[idx];
  const next = idx + 1 < RANK_TIERS.length ? RANK_TIERS[idx + 1] : null;

  let progressPercent = 100;
  if (next) {
    const span = next.minXp - current.minXp;
    const gained = xp - current.minXp;
    progressPercent = Math.min(100, Math.max(0, Math.round((gained / span) * 100)));
  }

  return {
    rank: current.rank,
    tier: idx + 1,
    nextRank: next ? next.rank : null,
    currentMinXp: current.minXp,
    nextMinXp: next ? next.minXp : null,
    progressPercent,
  };
}
