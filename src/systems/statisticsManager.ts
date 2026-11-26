import type { PlayerProfile } from '../types/game';
import { TOTAL_LEVELS } from '../engine/mazeGenerator';

export function computeWinPercentage(totalWins: number, totalGames: number): number {
  if (totalGames <= 0) return 0;
  return Math.round((totalWins / totalGames) * 10000) / 100;
}

export function computeCompletionRate(completedLevels: number[], totalLevels: number = TOTAL_LEVELS): number {
  if (totalLevels <= 0) return 0;
  return Math.round((completedLevels.length / totalLevels) * 100);
}

export function computeAverageCompletionTime(player: PlayerProfile): number | null {
  if (player.totalWins <= 0 || player.totalCompletionTime <= 0) return null;
  return player.totalCompletionTime / player.totalWins;
}

export function calculateScore(
  level: number,
  timeSeconds: number,
  moves: number,
  keysCollected: number = 0,
  cheesesCollected: number = 0
): number {
  const baseScore = level * 2500 + keysCollected * 400 + cheesesCollected * 150;
  const timePenalty = Math.max(0, Math.round(timeSeconds * 12));
  const movePenalty = moves * 8;
  return Math.max(100, baseScore - timePenalty - movePenalty);
}

export function getComputedStatistics(player: PlayerProfile) {
  return {
    totalGames: player.totalGames,
    totalWins: player.totalWins,
    totalLosses: player.totalLosses,
    winPercentage: computeWinPercentage(player.totalWins, player.totalGames),
    completionRate: computeCompletionRate(player.completedLevels, TOTAL_LEVELS),
    averageCompletionTime: computeAverageCompletionTime(player),
    highestScore: player.highestScore,
    cheeseCollected: player.cheeseCollected,
    currentStreak: player.winningStreak,
    bestStreak: player.bestStreak,
    bestTime: player.bestTime,
  };
}
