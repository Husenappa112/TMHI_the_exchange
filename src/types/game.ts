export type Position = {
  x: number;
  y: number;
};

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type SuspicionState = 'Watching' | 'Suspicious' | 'Manipulating' | 'Hostile';

export interface KeyItem {
  id: string;
  x: number;
  y: number;
  collected: boolean;
}

export interface CheeseItem {
  id: string;
  x: number;
  y: number;
  collected: boolean;
}

export interface CatState {
  pos: Position;
  stunnedUntil: number;
  panicked: boolean;
  speedMs: number;
}

export interface DogState {
  id: string;
  name: string;
  emoji: string;
  pos: Position;
  speedMs: number;
  mode: 'direct' | 'flank';
}

export interface GhostState {
  pos: Position;
  visible: boolean;
  opacity: number;
  lastToggleAt: number;
  phrase: string;
  target: Position;
  mode: 'patrol' | 'haunt';
}

export interface FloatingBubble {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  expiresAt: number;
}

export interface ShiftingWall {
  x: number;
  y: number;
  type: 'closing' | 'opening';
  progress: number; // 0 to 1
  duration: number; // in ms
  startTime: number;
}

export interface MazeMessage {
  id: number;
  text: string;
  type: 'info' | 'warning' | 'hostile' | 'mutation' | 'key';
  timestamp: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  victories: number;
  bestTimeByLevel: Record<number, number>; // level -> time in seconds
  bestScoreByLevel: Record<number, number>; // level -> score
  totalMoves: number;
  favouriteCorridorTotal?: string;
}

export interface LevelConfig {
  level: number;
  name: string;
  difficulty: 'Easy' | 'Normal' | 'Challenging' | 'Hard' | 'Extreme';
  description: string;
  gridWidth: number;
  gridHeight: number;
  keysRequired: number;
  braidFactor: number; // 0 to 1, probability of removing dead ends to create loops
  suspicionSensitivity: number; // multiplier for suspicion growth
  shiftFrequency: number; // moves between periodic shift checks
  adaptiveAggression: number; // how aggressively it blocks player favorite paths
  timeLimitSeconds: number;
  targetTimeSeconds: number;
  xpReward: number;
  coinReward: number;
}

export interface PlayerSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  showHeatmap: boolean;
}

export interface RecentGameEntry {
  sessionId: string;
  level: number;
  result: 'win' | 'loss';
  score: number;
  timeSeconds: number;
  moves: number;
  cheeseCollected: number;
  xpEarned: number;
  coinsEarned: number;
  timestamp: number;
}

export interface PlayerProfile {
  username: string;
  xp: number;
  coins: number;
  currentLevel: number;
  unlockedLevels: number[];
  completedLevels: number[];
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winPercentage: number;
  cheeseCollected: number;
  bestTime: number | null;
  bestTimeByLevel: Record<number, number>;
  bestScoreByLevel: Record<number, number>;
  highestScore: number;
  totalCompletionTime: number;
  totalMoves: number;
  winningStreak: number;
  bestStreak: number;
  achievements: string[];
  lastPlayed: string | null;
  favouriteCorridorTotal?: string;
}

export interface PlayerSaveData {
  player: PlayerProfile;
  settings: PlayerSettings;
  recentGames: RecentGameEntry[];
  processedSessionIds: string[];
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpBonus: number;
  coinBonus: number;
}

export interface MemoryData {
  visitedCounts: Record<string, number>; // "x,y" -> count
  edgeUsage: Record<string, number>; // "x1,y1-x2,y2" -> count
  directionCounts: Record<Direction, number>;
  recentPositions: Position[]; // last 30 positions
  recentDirections: Direction[]; // recent move directions
  oscillations: number;
  totalRepeats: number;
  preferredDirection: Direction;
  favouriteCorridor: { key: string; count: number };
}

export interface MazeGrid {
  width: number;
  height: number;
  cells: number[][]; // 0 = path, 1 = permanent/current wall
}
