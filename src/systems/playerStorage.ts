import type { PlayerSaveData, PlayerSettings, PlayerProfile } from '../types/game';

export const PLAYER_STORAGE_KEY = 'MAZE_OF_BAD_HABITS_SAVE_V1';

export function createDefaultPlayerProfile(): PlayerProfile {
  return {
    username: 'Player',
    xp: 0,
    coins: 0,
    currentLevel: 1,
    unlockedLevels: [1],
    completedLevels: [],
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    winPercentage: 0,
    cheeseCollected: 0,
    bestTime: null,
    bestTimeByLevel: {},
    bestScoreByLevel: {},
    highestScore: 0,
    totalCompletionTime: 0,
    totalMoves: 0,
    winningStreak: 0,
    bestStreak: 0,
    achievements: [],
    lastPlayed: null,
  };
}

export function createDefaultSettings(): PlayerSettings {
  return {
    soundEnabled: true,
    musicEnabled: true,
    showHeatmap: true,
  };
}

export function createDefaultSaveData(): PlayerSaveData {
  return {
    player: createDefaultPlayerProfile(),
    settings: createDefaultSettings(),
    recentGames: [],
    processedSessionIds: [],
  };
}

function sanitizeNumberArray(val: unknown, fallback: number[], min: number, max: number): number[] {
  if (!Array.isArray(val)) return [...fallback];
  const valid = val.filter(
    (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max
  );
  return valid.length > 0 ? Array.from(new Set(valid)).sort((a, b) => a - b) : [...fallback];
}

function sanitizeNumberRecord(val: unknown): Record<number, number> {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return {};
  const result: Record<number, number> = {};
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    const keyNum = Number(k);
    if (Number.isInteger(keyNum) && typeof v === 'number' && Number.isFinite(v)) {
      result[keyNum] = v;
    }
  }
  return result;
}

function sanitizeSaveData(raw: unknown): PlayerSaveData {
  const defaults = createDefaultSaveData();
  if (!raw || typeof raw !== 'object') return defaults;

  const obj = raw as Record<string, unknown>;
  const p = (obj.player && typeof obj.player === 'object' ? obj.player : {}) as Record<string, unknown>;
  const s = (obj.settings && typeof obj.settings === 'object' ? obj.settings : {}) as Record<string, unknown>;

  const unlockedLevels = sanitizeNumberArray(p.unlockedLevels, [1], 1, 5);
  if (!unlockedLevels.includes(1)) unlockedLevels.unshift(1);

  const completedLevels = Array.isArray(p.completedLevels)
    ? Array.from(
        new Set(
          p.completedLevels.filter(
            (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5
          )
        )
      ).sort((a, b) => a - b)
    : [];

  const totalWins = typeof p.totalWins === 'number' && p.totalWins >= 0 ? p.totalWins : 0;
  const totalLosses = typeof p.totalLosses === 'number' && p.totalLosses >= 0 ? p.totalLosses : 0;
  const totalGames =
    typeof p.totalGames === 'number' && p.totalGames >= totalWins + totalLosses
      ? p.totalGames
      : totalWins + totalLosses;

  const winPercentage =
    totalGames === 0 ? 0 : Math.round((totalWins / totalGames) * 10000) / 100;

  const player: PlayerProfile = {
    username:
      typeof p.username === 'string' && p.username.trim().length > 0
        ? p.username.trim().slice(0, 24)
        : 'Player',
    xp: typeof p.xp === 'number' && p.xp >= 0 ? Math.floor(p.xp) : 0,
    coins: typeof p.coins === 'number' && p.coins >= 0 ? Math.floor(p.coins) : 0,
    currentLevel:
      typeof p.currentLevel === 'number' && p.currentLevel >= 1 && p.currentLevel <= 5
        ? p.currentLevel
        : 1,
    unlockedLevels,
    completedLevels,
    totalGames,
    totalWins,
    totalLosses,
    winPercentage,
    cheeseCollected:
      typeof p.cheeseCollected === 'number' && p.cheeseCollected >= 0
        ? Math.floor(p.cheeseCollected)
        : 0,
    bestTime:
      typeof p.bestTime === 'number' && Number.isFinite(p.bestTime) && p.bestTime > 0
        ? p.bestTime
        : null,
    bestTimeByLevel: sanitizeNumberRecord(p.bestTimeByLevel),
    bestScoreByLevel: sanitizeNumberRecord(p.bestScoreByLevel),
    highestScore:
      typeof p.highestScore === 'number' && p.highestScore >= 0 ? Math.floor(p.highestScore) : 0,
    totalCompletionTime:
      typeof p.totalCompletionTime === 'number' && p.totalCompletionTime >= 0
        ? p.totalCompletionTime
        : 0,
    totalMoves:
      typeof p.totalMoves === 'number' && p.totalMoves >= 0 ? Math.floor(p.totalMoves) : 0,
    winningStreak:
      typeof p.winningStreak === 'number' && p.winningStreak >= 0
        ? Math.floor(p.winningStreak)
        : 0,
    bestStreak:
      typeof p.bestStreak === 'number' && p.bestStreak >= 0 ? Math.floor(p.bestStreak) : 0,
    achievements: Array.isArray(p.achievements)
      ? Array.from(new Set(p.achievements.filter((a): a is string => typeof a === 'string')))
      : [],
    lastPlayed: typeof p.lastPlayed === 'string' ? p.lastPlayed : null,
    favouriteCorridorTotal:
      typeof p.favouriteCorridorTotal === 'string' ? p.favouriteCorridorTotal : undefined,
  };

  const settings: PlayerSettings = {
    soundEnabled: typeof s.soundEnabled === 'boolean' ? s.soundEnabled : true,
    musicEnabled: typeof s.musicEnabled === 'boolean' ? s.musicEnabled : true,
    showHeatmap: typeof s.showHeatmap === 'boolean' ? s.showHeatmap : true,
  };

  const recentGames = Array.isArray(obj.recentGames)
    ? obj.recentGames
        .filter((g): g is PlayerSaveData['recentGames'][number] => Boolean(g && typeof g === 'object'))
        .slice(0, 20)
    : [];

  const processedSessionIds = Array.isArray(obj.processedSessionIds)
    ? obj.processedSessionIds.filter((id): id is string => typeof id === 'string').slice(-50)
    : [];

  return {
    player,
    settings,
    recentGames,
    processedSessionIds,
  };
}

/**
 * Loads saved player data safely without overwriting existing storage.
 */
export function loadSaveData(): PlayerSaveData {
  try {
    if (typeof localStorage === 'undefined') return createDefaultSaveData();
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return createDefaultSaveData();
    const parsed = JSON.parse(raw);
    return sanitizeSaveData(parsed);
  } catch {
    return createDefaultSaveData();
  }
}

/**
 * Persists complete player save data immediately.
 */
export function writeSaveData(data: PlayerSaveData): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota or private mode fallback
  }
}

export function updateUsername(username: string): PlayerSaveData {
  const data = loadSaveData();
  const clean = username.trim().slice(0, 24) || 'Player';
  data.player.username = clean;
  writeSaveData(data);
  return data;
}

export function updateSettings(partial: Partial<PlayerSettings>): PlayerSaveData {
  const data = loadSaveData();
  data.settings = { ...data.settings, ...partial };
  writeSaveData(data);
  return data;
}

/**
 * Explicitly resets all player progress back to defaults. Must only be called after confirmation.
 */
export function resetAllPlayerData(): PlayerSaveData {
  const fresh = createDefaultSaveData();
  writeSaveData(fresh);
  return fresh;
}

export function getStorageVerificationInfo(): {
  exists: boolean;
  bytes: number;
  integrity: 'OK' | 'EMPTY' | 'CORRUPT';
  lastPlayed: string | null;
} {
  try {
    if (typeof localStorage === 'undefined') {
      return { exists: false, bytes: 0, integrity: 'EMPTY', lastPlayed: null };
    }
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) {
      return { exists: false, bytes: 0, integrity: 'EMPTY', lastPlayed: null };
    }
    const parsed = JSON.parse(raw) as Partial<PlayerSaveData>;
    return {
      exists: true,
      bytes: raw.length,
      integrity: parsed && parsed.player ? 'OK' : 'CORRUPT',
      lastPlayed: parsed?.player?.lastPlayed || null,
    };
  } catch {
    return { exists: true, bytes: 0, integrity: 'CORRUPT', lastPlayed: null };
  }
}
