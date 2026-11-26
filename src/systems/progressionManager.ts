import type { AchievementDef, PlayerSaveData } from '../types/game';
import { LEVEL_CONFIGS, TOTAL_LEVELS } from '../engine/mazeGenerator';
import { loadSaveData, writeSaveData } from './playerStorage';
import { calculateScore, computeWinPercentage } from './statisticsManager';
import { evaluateAchievements, ACHIEVEMENTS } from './achievementManager';

export interface CompleteSessionParams {
  sessionId: string;
  level: number;
  timeSeconds: number;
  moves: number;
  keysCollected: number;
  cheesesCollected: number;
  totalCheesesInLevel: number;
  ghostEncountered: boolean;
  favouriteCorridor: string;
}

export interface CompleteSessionResult {
  saveData: PlayerSaveData;
  score: number;
  isNewBestScore: boolean;
  xpEarned: number;
  coinsEarned: number;
  newlyUnlockedAchievements: AchievementDef[];
  alreadyProcessed: boolean;
}

export interface FailSessionParams {
  sessionId: string;
  level: number;
  timeSeconds: number;
  moves: number;
  cheesesCollected: number;
  favouriteCorridor: string;
}

export function isLevelUnlocked(saveData: PlayerSaveData, level: number): boolean {
  return saveData.player.unlockedLevels.includes(level);
}

export function markLevelStarted(level: number): PlayerSaveData {
  const data = loadSaveData();
  const validLevel = data.player.unlockedLevels.includes(level) ? level : 1;
  data.player.currentLevel = validLevel;
  data.player.lastPlayed = new Date().toISOString();
  writeSaveData(data);
  return data;
}

export function recordCheeseCollectedImmediate(): {
  saveData: PlayerSaveData;
  newlyUnlocked: AchievementDef[];
} {
  const data = loadSaveData();
  data.player.cheeseCollected += 1;
  data.player.coins += 5;

  const { newlyUnlocked, bonusXp, bonusCoins } = evaluateAchievements(data.player);
  if (newlyUnlocked.length > 0) {
    data.player.achievements.push(...newlyUnlocked.map((a) => a.id));
    data.player.xp += bonusXp;
    data.player.coins += bonusCoins;
  }

  writeSaveData(data);
  return { saveData: data, newlyUnlocked };
}

export function completeLevelSession(params: CompleteSessionParams): CompleteSessionResult {
  const data = loadSaveData();
  const score = calculateScore(
    params.level,
    params.timeSeconds,
    params.moves,
    params.keysCollected,
    params.cheesesCollected
  );

  // Duplicate session guard (e.g. page refresh / double trigger)
  if (data.processedSessionIds.includes(params.sessionId)) {
    const cached = data.recentGames.find((g) => g.sessionId === params.sessionId);
    return {
      saveData: data,
      score: cached ? cached.score : score,
      isNewBestScore: false,
      xpEarned: cached ? cached.xpEarned : 0,
      coinsEarned: cached ? cached.coinsEarned : 0,
      newlyUnlockedAchievements: [],
      alreadyProcessed: true,
    };
  }

  const cfg = LEVEL_CONFIGS[params.level] || LEVEL_CONFIGS[1];
  const player = data.player;

  // Mark level completed & unlock next level
  if (!player.completedLevels.includes(params.level)) {
    player.completedLevels = [...player.completedLevels, params.level].sort((a, b) => a - b);
  }
  const nextLevel = Math.min(TOTAL_LEVELS, params.level + 1);
  if (!player.unlockedLevels.includes(nextLevel)) {
    player.unlockedLevels = [...player.unlockedLevels, nextLevel].sort((a, b) => a - b);
  }
  player.currentLevel = nextLevel;

  // Update real win statistics
  player.totalGames += 1;
  player.totalWins += 1;
  player.winningStreak += 1;
  if (player.winningStreak > player.bestStreak) {
    player.bestStreak = player.winningStreak;
  }
  player.winPercentage = computeWinPercentage(player.totalWins, player.totalGames);
  player.totalMoves += params.moves;
  player.totalCompletionTime += params.timeSeconds;
  player.lastPlayed = new Date().toISOString();
  if (params.favouriteCorridor && params.favouriteCorridor !== 'None') {
    player.favouriteCorridorTotal = params.favouriteCorridor;
  }

  // Update best times & scores
  const prevBestScore = player.bestScoreByLevel[params.level] || 0;
  const prevBestTime = player.bestTimeByLevel[params.level];
  const isNewBestScore = score > prevBestScore;

  if (isNewBestScore) {
    player.bestScoreByLevel[params.level] = score;
  }
  if (score > player.highestScore) {
    player.highestScore = score;
  }
  if (prevBestTime === undefined || params.timeSeconds < prevBestTime) {
    player.bestTimeByLevel[params.level] = params.timeSeconds;
  }
  if (player.bestTime === null || params.timeSeconds < player.bestTime) {
    player.bestTime = params.timeSeconds;
  }

  // Rewards (XP + Coins)
  let xpEarned = cfg.xpReward + Math.max(10, Math.round(score / 100));
  let coinsEarned = cfg.coinReward;

  player.xp += xpEarned;
  player.coins += coinsEarned;

  // Evaluate Achievements
  const { newlyUnlocked, bonusXp, bonusCoins } = evaluateAchievements(player, {
    level: params.level,
    timeSeconds: params.timeSeconds,
    targetTimeSeconds: cfg.targetTimeSeconds,
    ghostEncountered: params.ghostEncountered,
    collectedAllCheeseInLevel:
      params.totalCheesesInLevel > 0 && params.cheesesCollected >= params.totalCheesesInLevel,
  });

  if (newlyUnlocked.length > 0) {
    player.achievements = Array.from(
      new Set([...player.achievements, ...newlyUnlocked.map((a) => a.id)])
    );
    player.xp += bonusXp;
    player.coins += bonusCoins;
    xpEarned += bonusXp;
    coinsEarned += bonusCoins;
  }

  // Log session history & dedup token
  data.recentGames = [
    {
      sessionId: params.sessionId,
      level: params.level,
      result: 'win' as const,
      score,
      timeSeconds: params.timeSeconds,
      moves: params.moves,
      cheeseCollected: params.cheesesCollected,
      xpEarned,
      coinsEarned,
      timestamp: Date.now(),
    },
    ...data.recentGames,
  ].slice(0, 20);
  data.processedSessionIds = [...data.processedSessionIds, params.sessionId].slice(-50);

  writeSaveData(data);

  return {
    saveData: data,
    score,
    isNewBestScore,
    xpEarned,
    coinsEarned,
    newlyUnlockedAchievements: newlyUnlocked,
    alreadyProcessed: false,
  };
}

export function failLevelSession(params: FailSessionParams): {
  saveData: PlayerSaveData;
  alreadyProcessed: boolean;
} {
  const data = loadSaveData();

  if (data.processedSessionIds.includes(params.sessionId)) {
    return { saveData: data, alreadyProcessed: true };
  }

  const player = data.player;
  // Preserve completedLevels and unlockedLevels completely!
  player.totalGames += 1;
  player.totalLosses += 1;
  player.winningStreak = 0;
  player.winPercentage = computeWinPercentage(player.totalWins, player.totalGames);
  player.totalMoves += params.moves;
  player.lastPlayed = new Date().toISOString();
  if (params.favouriteCorridor && params.favouriteCorridor !== 'None') {
    player.favouriteCorridorTotal = params.favouriteCorridor;
  }

  // Small consolation XP for participating
  const consolationXp = Math.min(25, Math.max(5, Math.floor(params.moves / 4)));
  player.xp += consolationXp;

  data.recentGames = [
    {
      sessionId: params.sessionId,
      level: params.level,
      result: 'loss' as const,
      score: 0,
      timeSeconds: params.timeSeconds,
      moves: params.moves,
      cheeseCollected: params.cheesesCollected,
      xpEarned: consolationXp,
      coinsEarned: 0,
      timestamp: Date.now(),
    },
    ...data.recentGames,
  ].slice(0, 20);
  data.processedSessionIds = [...data.processedSessionIds, params.sessionId].slice(-50);

  writeSaveData(data);
  return { saveData: data, alreadyProcessed: false };
}

export function getAchievementDetails(ids: string[]): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => ids.includes(a.id));
}
