import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PLAYER_STORAGE_KEY,
  loadSaveData,
  updateUsername,
  updateSettings,
  resetAllPlayerData,
} from '../src/systems/playerStorage';
import {
  markLevelStarted,
  recordCheeseCollectedImmediate,
  completeLevelSession,
  failLevelSession,
  isLevelUnlocked,
} from '../src/systems/progressionManager';
import { computeWinPercentage, computeCompletionRate } from '../src/systems/statisticsManager';
import { getPlayerRank } from '../src/systems/achievementManager';
import { generateMaze, LEVEL_CONFIGS, TOTAL_LEVELS } from '../src/engine/mazeGenerator';
import { isMazeSolvable } from '../src/engine/pathfinding';

// Lightweight in-memory localStorage mock for Node test runtime
const createStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

describe('Player Memory, Progression & Statistics (Tests A–F)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
  });

  it('Test A & B: First game win unlocks Level 2, awards XP/coins, and persists across reload', () => {
    let data = loadSaveData();
    expect(data.player.username).toBe('Player');
    expect(data.player.winPercentage).toBe(0);
    expect(data.player.unlockedLevels).toEqual([1]);

    updateUsername('WhiskerAce');
    markLevelStarted(1);

    const cheeseRes = recordCheeseCollectedImmediate();
    expect(cheeseRes.saveData.player.cheeseCollected).toBe(1);
    expect(cheeseRes.saveData.player.coins).toBe(5);

    const winRes = completeLevelSession({
      sessionId: 'sess_test_1',
      level: 1,
      timeSeconds: 24.5,
      moves: 32,
      keysCollected: 1,
      cheesesCollected: 3,
      totalCheesesInLevel: 3,
      ghostEncountered: true,
      favouriteCorridor: '3,3',
    });

    expect(winRes.alreadyProcessed).toBe(false);
    expect(winRes.saveData.player.totalWins).toBe(1);
    expect(winRes.saveData.player.completedLevels).toEqual([1]);
    expect(winRes.saveData.player.unlockedLevels).toEqual([1, 2]);
    expect(winRes.saveData.player.xp).toBeGreaterThan(0);
    expect(winRes.saveData.player.coins).toBeGreaterThan(5);
    expect(winRes.saveData.player.achievements).toContain('first_escape');
    expect(winRes.saveData.player.achievements).toContain('speed_rat');
    expect(winRes.saveData.player.achievements).toContain('ghost_dodger');
    expect(winRes.saveData.player.achievements).toContain('perfect_run');

    // Simulate browser refresh by reloading cleanly from localStorage
    const reloaded = loadSaveData();
    expect(reloaded.player.username).toBe('WhiskerAce');
    expect(reloaded.player.completedLevels).toEqual([1]);
    expect(reloaded.player.unlockedLevels).toEqual([1, 2]);
    expect(reloaded.player.xp).toBe(winRes.saveData.player.xp);
    expect(reloaded.player.coins).toBe(winRes.saveData.player.coins);
    expect(isLevelUnlocked(reloaded, 2)).toBe(true);
    expect(isLevelUnlocked(reloaded, 3)).toBe(false);
  });

  it('Test C & D: Loss preserves unlocked levels and calculates exact 66.67% win rate', () => {
    // Win 1
    completeLevelSession({
      sessionId: 'sess_w1',
      level: 1,
      timeSeconds: 30,
      moves: 40,
      keysCollected: 1,
      cheesesCollected: 1,
      totalCheesesInLevel: 3,
      ghostEncountered: false,
      favouriteCorridor: '2,2',
    });

    // Win 2
    completeLevelSession({
      sessionId: 'sess_w2',
      level: 2,
      timeSeconds: 45,
      moves: 55,
      keysCollected: 2,
      cheesesCollected: 2,
      totalCheesesInLevel: 4,
      ghostEncountered: true,
      favouriteCorridor: '4,4',
    });

    // Loss 1
    const failRes = failLevelSession({
      sessionId: 'sess_l1',
      level: 3,
      timeSeconds: 20,
      moves: 18,
      cheesesCollected: 0,
      favouriteCorridor: '1,2',
    });

    const p = failRes.saveData.player;
    expect(p.totalGames).toBe(3);
    expect(p.totalWins).toBe(2);
    expect(p.totalLosses).toBe(1);
    expect(p.winPercentage).toBe(66.67);
    expect(computeWinPercentage(2, 3)).toBe(66.67);
    expect(p.winningStreak).toBe(0);
    expect(p.bestStreak).toBe(2);
    // Previously completed & unlocked levels preserved!
    expect(p.completedLevels).toEqual([1, 2]);
    expect(p.unlockedLevels).toEqual([1, 2, 3]);
  });

  it('Test E: Duplicate session ID never counts a victory or loss twice', () => {
    const first = completeLevelSession({
      sessionId: 'sess_dup_check',
      level: 1,
      timeSeconds: 28,
      moves: 30,
      keysCollected: 1,
      cheesesCollected: 1,
      totalCheesesInLevel: 3,
      ghostEncountered: false,
      favouriteCorridor: '1,3',
    });
    expect(first.alreadyProcessed).toBe(false);
    expect(first.saveData.player.totalWins).toBe(1);

    const duplicate = completeLevelSession({
      sessionId: 'sess_dup_check',
      level: 1,
      timeSeconds: 28,
      moves: 30,
      keysCollected: 1,
      cheesesCollected: 1,
      totalCheesesInLevel: 3,
      ghostEncountered: false,
      favouriteCorridor: '1,3',
    });
    expect(duplicate.alreadyProcessed).toBe(true);
    expect(duplicate.saveData.player.totalWins).toBe(1);
    expect(duplicate.saveData.player.xp).toBe(first.saveData.player.xp);
    expect(duplicate.saveData.player.coins).toBe(first.saveData.player.coins);
  });

  it('Test F: Handles corrupted localStorage safely and resets cleanly when requested', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, '{not-valid-json');
    const recovered = loadSaveData();
    expect(recovered.player.username).toBe('Player');
    expect(recovered.player.unlockedLevels).toEqual([1]);

    updateUsername('Tester');
    updateSettings({ soundEnabled: false, musicEnabled: false });
    completeLevelSession({
      sessionId: 'sess_before_reset',
      level: 1,
      timeSeconds: 25,
      moves: 25,
      keysCollected: 1,
      cheesesCollected: 2,
      totalCheesesInLevel: 3,
      ghostEncountered: false,
      favouriteCorridor: '2,3',
    });

    const reset = resetAllPlayerData();
    expect(reset.player.username).toBe('Player');
    expect(reset.player.totalGames).toBe(0);
    expect(reset.player.xp).toBe(0);
    expect(reset.player.unlockedLevels).toEqual([1]);
    expect(reset.player.completedLevels).toEqual([]);
  });

  it('All 5 progression levels generate solvable mazes and compute completion/rank properly', () => {
    expect(TOTAL_LEVELS).toBe(5);
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const cfg = LEVEL_CONFIGS[lvl];
      const maze = generateMaze(cfg);
      expect(
        isMazeSolvable(
          maze.grid,
          maze.start,
          maze.keys.map((k) => ({ x: k.x, y: k.y })),
          maze.exit
        )
      ).toBe(true);
      expect(maze.dogSpawns.length).toBeGreaterThanOrEqual(2);
    }

    expect(computeCompletionRate([1, 2], 5)).toBe(40);
    expect(getPlayerRank(0).rank).toBe('Rookie Squeak');
    expect(getPlayerRank(250).rank).toBe('Tunnel Runner');
    expect(getPlayerRank(2100).rank).toBe('Maze Overlord');
  });
});
