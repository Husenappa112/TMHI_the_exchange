import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  Position,
  Direction,
  KeyItem,
  CheeseItem,
  ShiftingWall,
  MazeMessage,
  MemoryData,
  SuspicionState,
  CatState,
  DogState,
  GhostState,
  FloatingBubble,
  PlayerSaveData,
  PlayerSettings,
  AchievementDef,
} from './types/game';
import { generateMaze, LEVEL_CONFIGS, TOTAL_LEVELS, type GeneratedMaze } from './engine/mazeGenerator';
import { isWalkable } from './engine/pathfinding';
import { MazeMemoryEngine, type MutationResult } from './engine/adaptiveMemory';
import {
  createInitialCat,
  createInitialDogs,
  createInitialGhost,
  computeNextCatPos,
  computeNextDogPos,
  computeNextGhostPos,
  pickGhostAppearPos,
  GHOST_PHRASES,
} from './engine/characterAI';
import { sound } from './engine/soundSynth';
import {
  loadSaveData,
  updateUsername,
  updateSettings,
  resetAllPlayerData,
} from './systems/playerStorage';
import { calculateScore } from './systems/statisticsManager';
import {
  isLevelUnlocked,
  markLevelStarted,
  recordCheeseCollectedImmediate,
  completeLevelSession,
  failLevelSession,
} from './systems/progressionManager';
import { MazeCanvas } from './components/MazeCanvas';
import { HUD, TouchControls } from './components/HUD';
import { AnimatedMazeBg } from './components/AnimatedMazeBg';
import { DashboardNav, type HubTab } from './components/DashboardNav';
import { DashboardScreen } from './components/DashboardScreen';
import { LevelSelectScreen } from './components/LevelSelectScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { StatisticsScreen } from './components/StatisticsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';

interface MemorySnapshot {
  memoryData: MemoryData;
  suspicion: number;
  suspicionState: SuspicionState;
}

const INITIAL_SNAPSHOT: MemorySnapshot = {
  memoryData: {
    visitedCounts: {},
    edgeUsage: {},
    directionCounts: { UP: 0, DOWN: 0, LEFT: 0, RIGHT: 0 },
    recentPositions: [],
    recentDirections: [],
    oscillations: 0,
    totalRepeats: 0,
    preferredDirection: 'RIGHT',
    favouriteCorridor: { key: 'None', count: 0 },
  },
  suspicion: 10,
  suspicionState: 'Watching',
};

const EMPTY_CAT: CatState = { pos: { x: 11, y: 11 }, stunnedUntil: 0, panicked: false, speedMs: 560 };
const EMPTY_GHOST: GhostState = {
  pos: { x: 7, y: 7 },
  visible: false,
  opacity: 0,
  lastToggleAt: 0,
  phrase: 'BOO! SURPRISE!',
  target: { x: 7, y: 7 },
  mode: 'haunt',
};

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const App: React.FC = () => {
  // Persistent Player Save Data (restored safely on startup without overwriting localStorage)
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => loadSaveData());

  // Navigation & Screen States (opens on Dashboard by default)
  const [screen, setScreen] = useState<'hub' | 'playing' | 'gameover'>('hub');
  const [hubTab, setHubTab] = useState<HubTab>('dashboard');
  const [currentLevel, setCurrentLevel] = useState<number>(() => saveData.player.currentLevel || 1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Maze & Entities State
  const [maze, setMaze] = useState<GeneratedMaze | null>(null);
  const [player, setPlayer] = useState<Position>({ x: 1, y: 1 });
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [cheeses, setCheeses] = useState<CheeseItem[]>([]);
  const [cat, setCat] = useState<CatState>(EMPTY_CAT);
  const [dogs, setDogs] = useState<DogState[]>([]);
  const [ghost, setGhost] = useState<GhostState>(EMPTY_GHOST);
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([]);

  const [moves, setMoves] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [shiftingWalls, setShiftingWalls] = useState<ShiftingWall[]>([]);
  const [predictedPath, setPredictedPath] = useState<Position[]>([]);
  const [activeMessage, setActiveMessage] = useState<MazeMessage | undefined>(undefined);
  const [memorySnapshot, setMemorySnapshot] = useState<MemorySnapshot>(INITIAL_SNAPSHOT);

  // Outcome
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [outcomeTitle, setOutcomeTitle] = useState<string>('');
  const [outcomeMessage, setOutcomeMessage] = useState<string>('');
  const [finalScore, setFinalScore] = useState<number>(0);
  const [isNewBestScore, setIsNewBestScore] = useState<boolean>(false);
  const [xpEarned, setXpEarned] = useState<number>(0);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<AchievementDef[]>([]);

  // Engines & Stable Refs
  const memoryEngineRef = useRef<MazeMemoryEngine>(new MazeMemoryEngine());
  const lastMoveTimeRef = useRef<number>(0);
  const timeElapsedRef = useRef<number>(0);
  const eventCooldownsRef = useRef<Record<string, number>>({});
  const bubbleIdRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(generateSessionId());
  const sessionResolvedRef = useRef<boolean>(false);
  const ghostEncounteredRef = useRef<boolean>(false);

  // Entity refs for smooth AI tick loop
  const mazeRef = useRef<GeneratedMaze | null>(null);
  const playerRef = useRef<Position>({ x: 1, y: 1 });
  const catRef = useRef<CatState>(EMPTY_CAT);
  const dogsRef = useRef<DogState[]>([]);
  const ghostRef = useRef<GhostState>(EMPTY_GHOST);
  const movesRef = useRef<number>(0);
  const cheesesCollectedRef = useRef<number>(0);
  const lastCatStepAtRef = useRef<number>(0);
  const lastDogStepAtRef = useRef<Record<string, number>>({});
  const lastGhostStepAtRef = useRef<number>(0);

  const levelConfig = LEVEL_CONFIGS[currentLevel] || LEVEL_CONFIGS[1];

  // Sync audio preferences from saved settings on mount and whenever settings change
  useEffect(() => {
    sound.setMuted(!saveData.settings.soundEnabled);
    sound.setMusicEnabled(saveData.settings.musicEnabled);
  }, [saveData.settings.soundEnabled, saveData.settings.musicEnabled]);

  const syncMemorySnapshot = useCallback(() => {
    const engine = memoryEngineRef.current;
    setMemorySnapshot({
      memoryData: engine.getMemoryData(),
      suspicion: engine.getSuspicion(),
      suspicionState: engine.getSuspicionState(),
    });
  }, []);

  const emitFunnyEvent = useCallback(
    (
      key: string,
      text: string,
      pos: Position,
      color: string,
      msgType: MazeMessage['type'] = 'info',
      cooldownMs: number = 3500
    ) => {
      const now = Date.now();
      const last = eventCooldownsRef.current[key] || 0;
      if (now - last < cooldownMs) return false;
      eventCooldownsRef.current[key] = now;

      const bubble: FloatingBubble = {
        id: ++bubbleIdRef.current,
        text,
        x: pos.x,
        y: pos.y,
        color,
        expiresAt: now + 2400,
      };
      setBubbles((prev) => [...prev.filter((b) => b.expiresAt > now).slice(-2), bubble]);
      setActiveMessage({
        id: now,
        text,
        type: msgType,
        timestamp: now,
      });
      return true;
    },
    []
  );

  const applyMutationVisuals = useCallback(
    (shiftResult: MutationResult, fallbackPos: Position) => {
      sound.playWallShift();
      const newShifting: ShiftingWall[] = [];
      const ts = Date.now();
      if (shiftResult.closedWall) {
        newShifting.push({
          x: shiftResult.closedWall.x,
          y: shiftResult.closedWall.y,
          type: 'closing',
          progress: 0,
          duration: 1000,
          startTime: ts,
        });
      }
      if (shiftResult.openedWall) {
        newShifting.push({
          x: shiftResult.openedWall.x,
          y: shiftResult.openedWall.y,
          type: 'opening',
          progress: 0,
          duration: 1000,
          startTime: ts,
        });
      }
      setShiftingWalls(newShifting);
      emitFunnyEvent(
        'maze_cheat',
        'THE MAZE IS CHEATING AGAIN!',
        shiftResult.closedWall || shiftResult.openedWall || fallbackPos,
        '#b026ff',
        'mutation',
        2500
      );
    },
    [emitFunnyEvent]
  );

  /**
   * Initializes a level session & saves level start immediately
   */
  const initLevel = useCallback(
    (lvl: number) => {
      const latest = loadSaveData();
      const targetLevel = isLevelUnlocked(latest, lvl) ? lvl : 1;
      const updatedAfterStart = markLevelStarted(targetLevel);
      setSaveData(updatedAfterStart);

      const now = Date.now();
      const cfg = LEVEL_CONFIGS[targetLevel] || LEVEL_CONFIGS[1];
      const generated = generateMaze(cfg);

      const initialCat = createInitialCat(generated.catSpawn, targetLevel);
      const initialDogs = createInitialDogs(generated.dogSpawns, targetLevel);
      const initialGhost = createInitialGhost(generated.ghostSpawn, now);

      sessionIdRef.current = generateSessionId();
      sessionResolvedRef.current = false;
      ghostEncounteredRef.current = false;

      mazeRef.current = generated;
      playerRef.current = generated.start;
      catRef.current = initialCat;
      dogsRef.current = initialDogs;
      ghostRef.current = initialGhost;
      movesRef.current = 0;
      cheesesCollectedRef.current = 0;
      timeElapsedRef.current = 0;
      eventCooldownsRef.current = {};
      lastCatStepAtRef.current = now + 900;
      lastDogStepAtRef.current = {};
      lastGhostStepAtRef.current = now;

      setMaze(generated);
      setPlayer(generated.start);
      setKeys(generated.keys);
      setCheeses(generated.cheeses);
      setCat(initialCat);
      setDogs(initialDogs);
      setGhost(initialGhost);
      setBubbles([]);
      setMoves(0);
      setTimeElapsed(0);
      setShiftingWalls([]);
      setIsPaused(false);
      setIsVictory(false);
      setOutcomeTitle('');
      setOutcomeMessage('');
      setFinalScore(0);
      setIsNewBestScore(false);
      setXpEarned(0);
      setCoinsEarned(0);
      setNewlyUnlockedAchievements([]);
      setCurrentLevel(targetLevel);

      memoryEngineRef.current.reset();
      syncMemorySnapshot();
      const initialPred = memoryEngineRef.current.predictPlayerRoute(
        generated.grid,
        generated.start,
        generated.keys.map((k) => ({ x: k.x, y: k.y })),
        generated.exit
      );
      setPredictedPath(initialPred);

      setActiveMessage({
        id: now,
        text: `Level ${targetLevel}: Run, ${updatedAfterStart.player.username}! The Cat is hunting you while ${initialDogs.length} Dogs chase the Cat!`,
        type: 'info',
        timestamp: now,
      });

      sound.startAmbience();
    },
    [syncMemorySnapshot]
  );

  const handleStartLevel = (lvl: number) => {
    initLevel(lvl);
    setScreen('playing');
  };

  const handleContinueGame = () => {
    const latest = loadSaveData();
    const target = isLevelUnlocked(latest, latest.player.currentLevel)
      ? latest.player.currentLevel
      : 1;
    initLevel(target);
    setScreen('playing');
  };

  const handleNewGame = () => {
    initLevel(1);
    setScreen('playing');
  };

  /**
   * Handles Failure / Cat Catch / Timeout / Abort (idempotent per sessionId)
   */
  const triggerDefeat = useCallback(
    (titleText: string, reasonText: string, caughtByCat: boolean = false) => {
      if (sessionResolvedRef.current) return;
      sessionResolvedRef.current = true;

      if (caughtByCat) {
        sound.playCatCatch();
      } else {
        sound.playGameOver();
      }
      sound.stopAmbience();

      const memory = memoryEngineRef.current.getMemoryData();
      const { saveData: updated } = failLevelSession({
        sessionId: sessionIdRef.current,
        level: currentLevel,
        timeSeconds: timeElapsedRef.current,
        moves: movesRef.current,
        cheesesCollected: cheesesCollectedRef.current,
        favouriteCorridor: memory.favouriteCorridor.key,
      });

      setSaveData(updated);
      setFinalScore(0);
      setIsNewBestScore(false);
      setIsVictory(false);
      setXpEarned(Math.min(25, Math.max(5, Math.floor(movesRef.current / 4))));
      setCoinsEarned(0);
      setNewlyUnlockedAchievements([]);
      setOutcomeTitle(titleText);
      setOutcomeMessage(reasonText);
      setActiveMessage({
        id: Date.now(),
        text: titleText,
        type: 'hostile',
        timestamp: Date.now(),
      });
      setScreen('gameover');
    },
    [currentLevel]
  );

  /**
   * Handles Victory (idempotent per sessionId)
   */
  const triggerVictory = useCallback(
    (keysCollectedCount: number, cheesesCollectedCount: number, totalCheesesInLevel: number) => {
      if (sessionResolvedRef.current) return;
      sessionResolvedRef.current = true;

      sound.playVictory();
      sound.stopAmbience();

      const memory = memoryEngineRef.current.getMemoryData();
      const favCorridor = `${memory.favouriteCorridor.key}`;
      const result = completeLevelSession({
        sessionId: sessionIdRef.current,
        level: currentLevel,
        timeSeconds: timeElapsedRef.current,
        moves: movesRef.current,
        keysCollected: keysCollectedCount,
        cheesesCollected: cheesesCollectedCount,
        totalCheesesInLevel,
        ghostEncountered: ghostEncounteredRef.current,
        favouriteCorridor: favCorridor,
      });

      setSaveData(result.saveData);
      setFinalScore(result.score);
      setIsNewBestScore(result.isNewBestScore);
      setXpEarned(result.xpEarned);
      setCoinsEarned(result.coinsEarned);
      setNewlyUnlockedAchievements(result.newlyUnlockedAchievements);
      setIsVictory(true);
      setOutcomeTitle('THE RAT WINS THIS ROUND!');
      setOutcomeMessage(
        currentLevel < TOTAL_LEVELS
          ? `Level ${currentLevel} completed! Level ${currentLevel + 1} is now unlocked.`
          : 'You conquered every level of The Maze Has Trust Issues!'
      );
      setActiveMessage({
        id: Date.now(),
        text: 'THE RAT WINS THIS ROUND!',
        type: 'info',
        timestamp: Date.now(),
      });
      setScreen('gameover');
    },
    [currentLevel]
  );

  /**
   * Move Player (Rat)
   */
  const handleMove = useCallback(
    (direction: Direction) => {
      if (screen !== 'playing' || isPaused || !maze || sessionResolvedRef.current) return;

      const now = performance.now();
      if (now - lastMoveTimeRef.current < 85) return;
      lastMoveTimeRef.current = now;

      let dx = 0;
      let dy = 0;
      if (direction === 'UP') dy = -1;
      else if (direction === 'DOWN') dy = 1;
      else if (direction === 'LEFT') dx = -1;
      else if (direction === 'RIGHT') dx = 1;

      const nx = player.x + dx;
      const ny = player.y + dy;

      if (!isWalkable(maze.grid, nx, ny)) {
        return;
      }

      const nextPos: Position = { x: nx, y: ny };
      const nextMoves = moves + 1;
      playerRef.current = nextPos;
      movesRef.current = nextMoves;
      setPlayer(nextPos);
      setMoves(nextMoves);
      sound.playStep();

      // Check immediate collision with Cat
      if (catRef.current.pos.x === nx && catRef.current.pos.y === ny) {
        triggerDefeat(
          'CAUGHT! CAT WINS!',
          'You ran straight into the hungry cat! Better luck next chase.',
          true
        );
        return;
      }

      // Check close call with Cat
      const catDist = Math.abs(catRef.current.pos.x - nx) + Math.abs(catRef.current.pos.y - ny);
      if (catDist <= 2) {
        emitFunnyEvent('close_call', 'THAT WAS CLOSE!', nextPos, '#ff2a55', 'warning', 3500);
      }

      // Record move in memory engine
      const { message, tierChanged } = memoryEngineRef.current.recordMove(player, nextPos, levelConfig);
      if (tierChanged) {
        sound.playSuspicionAlert();
      }
      if (message) {
        setActiveMessage(message);
      }

      // Check Cheese Pickup (persists immediately!)
      let updatedCheeses = cheeses;
      const cheeseOnCell = cheeses.find((c) => !c.collected && c.x === nx && c.y === ny);
      if (cheeseOnCell) {
        updatedCheeses = cheeses.map((c) =>
          c.id === cheeseOnCell.id ? { ...c, collected: true } : c
        );
        setCheeses(updatedCheeses);
        cheesesCollectedRef.current = updatedCheeses.filter((c) => c.collected).length;
        const { saveData: updatedSave } = recordCheeseCollectedImmediate();
        setSaveData(updatedSave);
        sound.playCheesePickup();
        emitFunnyEvent('cheese', 'YUM! +5 COINS 🧀', nextPos, '#ffe600', 'key', 800);
      }

      // Check Key Pickup
      const keyOnCell = keys.find((k) => !k.collected && k.x === nx && k.y === ny);
      let updatedKeys = keys;

      if (keyOnCell) {
        updatedKeys = keys.map((k) => (k.id === keyOnCell.id ? { ...k, collected: true } : k));
        setKeys(updatedKeys);
        sound.playKeyPickup();

        const keyMsg = memoryEngineRef.current.onKeyCollected(levelConfig);
        setActiveMessage(keyMsg);

        const remainingKeyCoords = updatedKeys
          .filter((k) => !k.collected)
          .map((k) => ({ x: k.x, y: k.y }));
        const shiftResult = memoryEngineRef.current.triggerAdaptiveRearrangement(
          maze.grid,
          nextPos,
          remainingKeyCoords,
          maze.exit,
          levelConfig
        );

        if (shiftResult) {
          applyMutationVisuals(shiftResult, nextPos);
        }
      } else if (nextMoves % levelConfig.shiftFrequency === 0) {
        const currentSuspicion = memoryEngineRef.current.getSuspicion();
        if (currentSuspicion >= 30) {
          const remainingKeyCoords = keys
            .filter((k) => !k.collected)
            .map((k) => ({ x: k.x, y: k.y }));
          const shiftResult = memoryEngineRef.current.triggerAdaptiveRearrangement(
            maze.grid,
            nextPos,
            remainingKeyCoords,
            maze.exit,
            levelConfig
          );

          if (shiftResult) {
            applyMutationVisuals(shiftResult, nextPos);
          }
        }
      }

      syncMemorySnapshot();

      const remainingCoordsAfter = updatedKeys
        .filter((k) => !k.collected)
        .map((k) => ({ x: k.x, y: k.y }));
      const nextPred = memoryEngineRef.current.predictPlayerRoute(
        maze.grid,
        nextPos,
        remainingCoordsAfter,
        maze.exit
      );
      setPredictedPath(nextPred);

      // Check Exit reached
      if (nx === maze.exit.x && ny === maze.exit.y) {
        const allKeysCollected = updatedKeys.every((k) => k.collected);
        if (allKeysCollected) {
          const cheeseCount = updatedCheeses.filter((c) => c.collected).length;
          triggerVictory(updatedKeys.length, cheeseCount, updatedCheeses.length);
        } else {
          emitFunnyEvent(
            'locked_exit',
            'The exit is locked! Grab all keys first!',
            nextPos,
            '#ff2a55',
            'warning',
            2200
          );
        }
      }
    },
    [
      screen,
      isPaused,
      maze,
      player,
      keys,
      cheeses,
      moves,
      levelConfig,
      applyMutationVisuals,
      syncMemorySnapshot,
      emitFunnyEvent,
      triggerDefeat,
      triggerVictory,
    ]
  );

  // Persistent Settings & Profile Handlers
  const handleUpdateSettings = useCallback((partial: Partial<PlayerSettings>) => {
    const updated = updateSettings(partial);
    setSaveData(updated);
    sound.setMuted(!updated.settings.soundEnabled);
    sound.setMusicEnabled(updated.settings.musicEnabled);
  }, []);

  const handleToggleSoundFromHUD = useCallback(() => {
    setSaveData((prev) => {
      const updated = updateSettings({ soundEnabled: !prev.settings.soundEnabled });
      sound.setMuted(!updated.settings.soundEnabled);
      return updated;
    });
  }, []);

  const handleToggleHeatmapFromHUD = useCallback(() => {
    setSaveData((prev) => updateSettings({ showHeatmap: !prev.settings.showHeatmap }));
  }, []);

  const handleSaveUsername = useCallback((username: string) => {
    const updated = updateUsername(username);
    setSaveData(updated);
  }, []);

  const handleResetProgress = useCallback(() => {
    const fresh = resetAllPlayerData();
    setSaveData(fresh);
    setCurrentLevel(1);
    sound.setMuted(!fresh.settings.soundEnabled);
    sound.setMusicEnabled(fresh.settings.musicEnabled);
  }, []);

  // Sync refs inside effect
  const handleMoveRef = useRef(handleMove);
  const handleToggleSoundRef = useRef(handleToggleSoundFromHUD);
  const triggerDefeatRef = useRef(triggerDefeat);
  const emitFunnyEventRef = useRef(emitFunnyEvent);
  const screenRef = useRef(screen);
  const showHelpRef = useRef(showHelpModal);

  useEffect(() => {
    handleMoveRef.current = handleMove;
    handleToggleSoundRef.current = handleToggleSoundFromHUD;
    triggerDefeatRef.current = triggerDefeat;
    emitFunnyEventRef.current = emitFunnyEvent;
    screenRef.current = screen;
    showHelpRef.current = showHelpModal;
  }, [handleMove, handleToggleSoundFromHUD, triggerDefeat, emitFunnyEvent, screen, showHelpModal]);

  // Single global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screenRef.current !== 'playing' || showHelpRef.current) return;

      if (e.repeat) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
        }
        return;
      }

      let dir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dir = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dir = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dir = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dir = 'RIGHT';
          break;
        case 'p':
        case 'P':
          setIsPaused((p) => !p);
          return;
        case 'm':
        case 'M':
          handleToggleSoundRef.current();
          return;
      }

      if (dir) {
        e.preventDefault();
        handleMoveRef.current(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      sound.stopAmbience();
    };
  }, []);

  /**
   * Unified 100ms Gameplay Simulation Loop
   */
  useEffect(() => {
    if (screen !== 'playing' || isPaused) return;

    const timer = setInterval(() => {
      if (sessionResolvedRef.current) return;
      const now = Date.now();
      const activeMaze = mazeRef.current;
      if (!activeMaze) return;

      // 1. Timer progression
      const nextTime = timeElapsedRef.current + 0.1;
      timeElapsedRef.current = nextTime;
      setTimeElapsed(nextTime);

      if (nextTime >= levelConfig.timeLimitSeconds) {
        clearInterval(timer);
        triggerDefeatRef.current(
          'SYSTEM LOCKDOWN — FAILED',
          'Time ran out before the rat could escape the adaptive maze.',
          false
        );
        return;
      }

      // 2. Step Cat AI (chasing Rat)
      let currentCat = catRef.current;
      let currentDogs = dogsRef.current;
      const currentRat = playerRef.current;

      if (now - lastCatStepAtRef.current >= currentCat.speedMs) {
        lastCatStepAtRef.current = now;
        const { nextPos, panicked } = computeNextCatPos(
          activeMaze.grid,
          currentCat,
          currentRat,
          currentDogs,
          now
        );
        currentCat = { ...currentCat, pos: nextPos, panicked };
        catRef.current = currentCat;
        setCat(currentCat);

        if (nextPos.x === currentRat.x && nextPos.y === currentRat.y) {
          clearInterval(timer);
          triggerDefeatRef.current(
            'CAUGHT! CAT WINS!',
            'The cat cornered the rat! Stay alert and let the dogs distract kitty.',
            true
          );
          return;
        }

        const distToRat = Math.abs(nextPos.x - currentRat.x) + Math.abs(nextPos.y - currentRat.y);
        if (distToRat <= 2) {
          if (emitFunnyEventRef.current('close_call', 'THAT WAS CLOSE!', currentRat, '#ff2a55', 'warning', 4000)) {
            sound.playCatMeow();
          }
        }
      }

      // 3. Step Dogs AI (2-3 Dogs chasing Cat!)
      let dogsUpdated = false;
      const nextDogs = currentDogs.map((dog, idx) => {
        const lastStep = lastDogStepAtRef.current[dog.id] || now;
        if (now - lastStep >= dog.speedMs) {
          lastDogStepAtRef.current[dog.id] = now;
          const others = currentDogs.filter((_, j) => j !== idx);
          const nextDogPos = computeNextDogPos(activeMaze.grid, dog, currentCat.pos, others);
          dogsUpdated = true;
          return { ...dog, pos: nextDogPos };
        }
        return dog;
      });

      if (dogsUpdated) {
        currentDogs = nextDogs;
        dogsRef.current = nextDogs;
        setDogs(nextDogs);

        const closeDogs = nextDogs.filter(
          (d) => Math.abs(d.pos.x - currentCat.pos.x) + Math.abs(d.pos.y - currentCat.pos.y) <= 2
        );
        const caughtCatDog = nextDogs.find(
          (d) => Math.abs(d.pos.x - currentCat.pos.x) + Math.abs(d.pos.y - currentCat.pos.y) <= 1
        );

        if (caughtCatDog) {
          const fired = emitFunnyEventRef.current(
            'dog_delivery',
            'DOG DELIVERY SERVICE!',
            currentCat.pos,
            '#38bdf8',
            'info',
            4800
          );
          if (fired) {
            sound.playDogBark();
            const stunnedCat: CatState = {
              ...catRef.current,
              stunnedUntil: now + 1700,
              panicked: true,
            };
            catRef.current = stunnedCat;
            setCat(stunnedCat);
          }
        } else if (closeDogs.length >= 2) {
          if (
            emitFunnyEventRef.current(
              'cat_trouble',
              'THE CAT IS IN TROUBLE!',
              currentCat.pos,
              '#ffe600',
              'warning',
              4500
            )
          ) {
            sound.playDogBark();
          }
        } else if (closeDogs.length === 1) {
          if (
            emitFunnyEventRef.current(
              'run_kitty',
              'RUN, KITTY, RUN!',
              currentCat.pos,
              '#fb923c',
              'warning',
              4500
            )
          ) {
            sound.playCatMeow();
          }
        }
      }

      // 4. Ghost Visibility & Patrol/Haunt AI
      let currentGhost = ghostRef.current;
      const elapsedSinceToggle = now - currentGhost.lastToggleAt;
      let ghostChanged = false;

      if (!currentGhost.visible && elapsedSinceToggle >= 4000) {
        const spawnPos = pickGhostAppearPos(activeMaze.grid, currentRat);
        const phrase = GHOST_PHRASES[Math.floor(Math.random() * GHOST_PHRASES.length)];
        currentGhost = {
          ...currentGhost,
          pos: spawnPos,
          visible: true,
          opacity: 0.25,
          lastToggleAt: now,
          phrase,
          target: currentRat,
          mode: 'haunt',
        };
        ghostChanged = true;
        ghostEncounteredRef.current = true;
        sound.playGhostSpook();
        emitFunnyEventRef.current(
          'ghost_appear',
          'BOO! SURPRISE!',
          spawnPos,
          '#00f0ff',
          'warning',
          5000
        );
      } else if (currentGhost.visible) {
        if (elapsedSinceToggle >= 14000) {
          currentGhost = {
            ...currentGhost,
            visible: false,
            opacity: 0,
            lastToggleAt: now,
          };
          ghostChanged = true;
        } else {
          const fadeInOpacity = Math.min(1, elapsedSinceToggle / 500);
          const fadeOutOpacity = Math.min(1, (14000 - elapsedSinceToggle) / 700);
          const targetOpacity = Math.min(fadeInOpacity, fadeOutOpacity);
          if (Math.abs(targetOpacity - currentGhost.opacity) > 0.05) {
            currentGhost = { ...currentGhost, opacity: targetOpacity };
            ghostChanged = true;
          }

          if (now - lastGhostStepAtRef.current >= 650) {
            lastGhostStepAtRef.current = now;
            const { nextPos, nextTarget, nextMode } = computeNextGhostPos(
              activeMaze.grid,
              currentGhost,
              currentRat
            );
            currentGhost = {
              ...currentGhost,
              pos: nextPos,
              target: nextTarget,
              mode: nextMode,
            };
            ghostChanged = true;

            if (nextPos.x === currentRat.x && nextPos.y === currentRat.y) {
              const phrase = GHOST_PHRASES[Math.floor(Math.random() * GHOST_PHRASES.length)];
              if (
                emitFunnyEventRef.current(
                  'ghost_boo',
                  phrase,
                  nextPos,
                  '#00f0ff',
                  'warning',
                  4200
                )
              ) {
                sound.playGhostSpook();
              }
            }
          }
        }
      }

      if (ghostChanged) {
        ghostRef.current = currentGhost;
        setGhost(currentGhost);
      }

      // 5. Prune expired floating bubbles
      setBubbles((prev) => {
        const filtered = prev.filter((b) => b.expiresAt > now);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [screen, isPaused, levelConfig.timeLimitSeconds]);

  // Shifting walls animation decay
  useEffect(() => {
    if (shiftingWalls.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setShiftingWalls((prev) =>
        prev
          .map((sw) => {
            const elapsed = now - sw.startTime;
            const progress = Math.min(1, elapsed / sw.duration);
            return { ...sw, progress };
          })
          .filter((sw) => sw.progress < 1)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [shiftingWalls.length]);

  const handleTogglePause = () => {
    setIsPaused((p) => !p);
  };

  const handleRestart = () => {
    if (!sessionResolvedRef.current && moves > 0) {
      const memory = memoryEngineRef.current.getMemoryData();
      const { saveData: updated } = failLevelSession({
        sessionId: sessionIdRef.current,
        level: currentLevel,
        timeSeconds: timeElapsedRef.current,
        moves,
        cheesesCollected: cheesesCollectedRef.current,
        favouriteCorridor: memory.favouriteCorridor.key,
      });
      setSaveData(updated);
    }
    initLevel(currentLevel);
  };

  const handleReturnToDashboard = () => {
    sound.stopAmbience();
    setSaveData(loadSaveData());
    setHubTab('dashboard');
    setScreen('hub');
  };

  const handleNextLevel = () => {
    const nextLvl = Math.min(TOTAL_LEVELS, currentLevel + 1);
    const latest = loadSaveData();
    if (isLevelUnlocked(latest, nextLvl)) {
      initLevel(nextLvl);
      setScreen('playing');
    } else {
      handleReturnToDashboard();
    }
  };

  const keysCollectedCount = keys.filter((k) => k.collected).length;
  const cheesesCollectedCount = cheeses.filter((c) => c.collected).length;
  const allKeysCollected = keys.length > 0 && keysCollectedCount === keys.length;
  const { memoryData, suspicion, suspicionState } = memorySnapshot;
  const liveScore = calculateScore(
    currentLevel,
    timeElapsed,
    moves,
    keysCollectedCount,
    cheesesCollectedCount
  );
  const timeRemaining = Math.max(0, levelConfig.timeLimitSeconds - timeElapsed);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#040711] text-gray-100 font-['Rajdhani'] selection:bg-emerald-400 selection:text-black">
      {/* Cyber Grid */}
      <div className="cyber-bg" />

      {/* Gaming Dashboard & Menu Views */}
      {screen === 'hub' && (
        <>
          <AnimatedMazeBg />
          <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col gap-5 p-3 sm:p-6">
            <DashboardNav
              activeTab={hubTab}
              player={saveData.player}
              onSelectTab={setHubTab}
              onOpenHelp={() => setShowHelpModal(true)}
            />

            {hubTab === 'dashboard' && (
              <DashboardScreen
                saveData={saveData}
                onContinueGame={handleContinueGame}
                onNewGame={handleNewGame}
                onNavigateTab={setHubTab}
                onSaveUsername={handleSaveUsername}
              />
            )}

            {hubTab === 'levels' && (
              <LevelSelectScreen
                player={saveData.player}
                onStartLevel={handleStartLevel}
              />
            )}

            {hubTab === 'profile' && (
              <ProfileScreen
                player={saveData.player}
                onSaveUsername={handleSaveUsername}
              />
            )}

            {hubTab === 'stats' && <StatisticsScreen saveData={saveData} />}

            {hubTab === 'settings' && (
              <SettingsScreen
                saveData={saveData}
                onUpdateSettings={handleUpdateSettings}
                onSaveUsername={handleSaveUsername}
                onResetProgress={handleResetProgress}
              />
            )}
          </div>
        </>
      )}

      {/* Active Gameplay View */}
      {screen === 'playing' && maze && (
        <main className="relative z-10 w-full max-w-5xl mx-auto flex flex-col flex-1 p-2 sm:p-4 gap-2.5">
          <HUD
            levelConfig={levelConfig}
            keysCollected={keysCollectedCount}
            keysRequired={keys.length}
            cheesesCollected={cheesesCollectedCount}
            cheesesTotal={cheeses.length}
            catPanicked={cat.panicked}
            dogCount={dogs.length}
            ghostVisible={ghost.visible}
            liveScore={liveScore}
            timeElapsed={timeElapsed}
            timeRemaining={timeRemaining}
            moves={moves}
            suspicion={suspicion}
            suspicionState={suspicionState}
            recentDirections={memoryData.recentDirections}
            preferredDirection={memoryData.preferredDirection}
            favouriteCorridor={memoryData.favouriteCorridor}
            activeMessage={activeMessage}
            isMuted={!saveData.settings.soundEnabled}
            isPaused={isPaused}
            showHeatmap={saveData.settings.showHeatmap}
            onToggleMute={handleToggleSoundFromHUD}
            onTogglePause={handleTogglePause}
            onRestart={handleRestart}
            onReturnHome={handleReturnToDashboard}
            onOpenHelp={() => setShowHelpModal(true)}
            onToggleHeatmap={handleToggleHeatmapFromHUD}
          />

          <div className="relative flex-1 flex flex-col items-center justify-center">
            <MazeCanvas
              grid={maze.grid}
              start={maze.start}
              player={player}
              keys={keys}
              cheeses={cheeses}
              exit={maze.exit}
              exitUnlocked={allKeysCollected}
              visitedCounts={memoryData.visitedCounts}
              shiftingWalls={shiftingWalls}
              cat={cat}
              dogs={dogs}
              ghost={ghost}
              bubbles={bubbles}
              predictedPath={predictedPath}
              showHeatmap={saveData.settings.showHeatmap}
              onCanvasSwipe={handleMove}
            />

            {isPaused && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center rounded-xl z-20 p-4 text-center">
                <h2 className="text-2xl sm:text-3xl font-black font-['Orbitron'] text-emerald-300 mb-2 tracking-widest">
                  NEURAL LINK PAUSED
                </h2>
                <p className="text-gray-400 font-mono text-xs sm:text-sm mb-6">
                  Chase & telemetry tracking suspended.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="neon-button neon-button-green py-3 px-6"
                  >
                    RESUME
                  </button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="neon-button neon-button-purple py-3 px-6"
                  >
                    RESTART
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      triggerDefeat(
                        'RUN ABORTED',
                        'Neural infiltration aborted by operator. Completed levels remain saved.',
                        false
                      )
                    }
                    className="neon-button neon-button-subtle py-3 px-5"
                  >
                    ABORT RUN
                  </button>
                </div>
              </div>
            )}
          </div>

          <TouchControls onMove={handleMove} />
        </main>
      )}

      {/* Victory / Defeat Modal */}
      {screen === 'gameover' && (
        <GameOverModal
          isVictory={isVictory}
          outcomeTitle={outcomeTitle}
          outcomeMessage={outcomeMessage}
          score={finalScore}
          isNewBestScore={isNewBestScore}
          xpEarned={xpEarned}
          coinsEarned={coinsEarned}
          newlyUnlockedAchievements={newlyUnlockedAchievements}
          timeElapsed={timeElapsed}
          moves={moves}
          suspicion={suspicion}
          suspicionState={suspicionState}
          favouriteCorridor={memoryData.favouriteCorridor}
          levelConfig={levelConfig}
          onNextLevel={handleNextLevel}
          onReplay={() => {
            initLevel(currentLevel);
            setScreen('playing');
          }}
          onReturnHome={handleReturnToDashboard}
        />
      )}

      {/* How To Play Modal */}
      {showHelpModal && <HowToPlayModal onClose={() => setShowHelpModal(false)} />}
    </div>
  );
};

export default App;
