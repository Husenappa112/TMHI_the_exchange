import type { Position, Direction, SuspicionState, MemoryData, MazeMessage, LevelConfig } from '../types/game';
import { isMazeSolvable, findShortestPath, predictPlayerHeading } from './pathfinding';

export interface MutationResult {
  closedWall?: Position;
  openedWall?: Position;
  message: string;
}

export class MazeMemoryEngine {
  private visitedCounts: Record<string, number> = {};
  private edgeUsage: Record<string, number> = {};
  private directionCounts: Record<Direction, number> = {
    UP: 0,
    DOWN: 0,
    LEFT: 0,
    RIGHT: 0,
  };
  private recentPositions: Position[] = [];
  private recentDirections: Direction[] = [];
  private oscillations: number = 0;
  private totalRepeats: number = 0;
  private suspicion: number = 10; // Start at 10%
  private lastMessageTimestamp: number = 0;
  private messageCounter: number = 0;

  constructor() {
    this.reset();
  }

  public reset() {
    this.visitedCounts = {};
    this.edgeUsage = {};
    this.directionCounts = { UP: 0, DOWN: 0, LEFT: 0, RIGHT: 0 };
    this.recentPositions = [];
    this.recentDirections = [];
    this.oscillations = 0;
    this.totalRepeats = 0;
    this.suspicion = 10;
    this.lastMessageTimestamp = 0;
    this.messageCounter = 0;
  }

  public getSuspicion(): number {
    return Math.min(100, Math.max(0, Math.round(this.suspicion)));
  }

  public getSuspicionState(): SuspicionState {
    const s = this.getSuspicion();
    if (s <= 25) return 'Watching';
    if (s <= 50) return 'Suspicious';
    if (s <= 75) return 'Manipulating';
    return 'Hostile';
  }

  public getMemoryData(): MemoryData {
    const dominantDir = this.calculateDominantDirection();
    const favourite = this.getFavouriteCorridor();

    return {
      visitedCounts: { ...this.visitedCounts },
      edgeUsage: { ...this.edgeUsage },
      directionCounts: { ...this.directionCounts },
      recentPositions: [...this.recentPositions],
      recentDirections: [...this.recentDirections],
      oscillations: this.oscillations,
      totalRepeats: this.totalRepeats,
      preferredDirection: dominantDir,
      favouriteCorridor: favourite,
    };
  }

  /**
   * Predicts the player's likely next path using movement heading + BFS toward nearest active objective.
   */
  public predictPlayerRoute(
    grid: number[][],
    playerPos: Position,
    remainingKeys: Position[],
    exitPos: Position
  ): Position[] {
    const heading = predictPlayerHeading(
      this.recentPositions,
      this.calculateDominantDirection()
    );
    const targets = remainingKeys.length > 0 ? remainingKeys : [exitPos];

    let bestPath: Position[] | null = null;
    for (const target of targets) {
      const path = findShortestPath(grid, playerPos, target);
      if (path && (!bestPath || path.length < bestPath.length)) {
        bestPath = path;
      }
    }

    // Bias check: if player's recent heading points immediately into an open cell, include it
    if (bestPath && bestPath.length > 1) {
      return bestPath.slice(0, 7);
    }

    const dirVec: Record<Direction, Position> = {
      UP: { x: 0, y: -1 },
      DOWN: { x: 0, y: 1 },
      LEFT: { x: -1, y: 0 },
      RIGHT: { x: 1, y: 0 },
    };
    const nextX = playerPos.x + dirVec[heading].x;
    const nextY = playerPos.y + dirVec[heading].y;
    if (
      nextY >= 0 &&
      nextY < grid.length &&
      nextX >= 0 &&
      nextX < grid[0].length &&
      grid[nextY][nextX] === 0
    ) {
      return [playerPos, { x: nextX, y: nextY }];
    }

    return [playerPos];
  }

  /**
   * Records a player movement and updates internal memory structures and suspicion score.
   */
  public recordMove(
    from: Position,
    to: Position,
    config: LevelConfig
  ): { suspicionDelta: number; message?: MazeMessage; tierChanged?: boolean } {
    const prevTier = this.getSuspicionState();
    const key = `${to.x},${to.y}`;
    const prevCount = this.visitedCounts[key] || 0;
    this.visitedCounts[key] = prevCount + 1;

    // Track edge traversal
    const edgeKey1 = `${from.x},${from.y}-${to.x},${to.y}`;
    const edgeKey2 = `${to.x},${to.y}-${from.x},${from.y}`;
    this.edgeUsage[edgeKey1] = (this.edgeUsage[edgeKey1] || 0) + 1;
    this.edgeUsage[edgeKey2] = (this.edgeUsage[edgeKey2] || 0) + 1;

    // Track direction
    let dir: Direction = 'RIGHT';
    if (to.y < from.y) dir = 'UP';
    else if (to.y > from.y) dir = 'DOWN';
    else if (to.x < from.x) dir = 'LEFT';
    else if (to.x > from.x) dir = 'RIGHT';
    this.directionCounts[dir]++;

    this.recentDirections.push(dir);
    if (this.recentDirections.length > 12) {
      this.recentDirections.shift();
    }

    // Track oscillation (A -> B -> A)
    let isOscillating = false;
    if (this.recentPositions.length >= 2) {
      const twoBack = this.recentPositions[this.recentPositions.length - 2];
      if (twoBack.x === to.x && twoBack.y === to.y) {
        this.oscillations++;
        isOscillating = true;
      }
    }

    // Append to recent positions
    this.recentPositions.push(to);
    if (this.recentPositions.length > 25) {
      this.recentPositions.shift();
    }

    // Suspicion calculation
    let suspicionDelta = 0;
    if (prevCount === 0) {
      // Exploring new cells stabilizes suspicion slightly
      suspicionDelta = -0.4 * config.suspicionSensitivity;
    } else {
      // Re-visiting cells increases suspicion
      this.totalRepeats++;
      suspicionDelta = (1.2 + Math.min(prevCount * 0.4, 2.5)) * config.suspicionSensitivity;
    }

    if (isOscillating) {
      suspicionDelta += 3.5 * config.suspicionSensitivity;
    }

    this.suspicion = Math.min(100, Math.max(5, this.suspicion + suspicionDelta));
    const nextTier = this.getSuspicionState();
    const tierChanged = nextTier !== prevTier && this.suspicion > 25;

    // Dynamic dialogue triggers
    const message = this.evaluatePersonalityComment(to, prevCount, isOscillating, dir);

    return { suspicionDelta, message, tierChanged };
  }

  /**
   * Increases suspicion when a key is acquired.
   */
  public onKeyCollected(config: LevelConfig): MazeMessage {
    this.suspicion = Math.min(100, this.suspicion + 18 * config.suspicionSensitivity);
    const msgs = [
      'Key secured... but the maze just shifted against you.',
      'I anticipated that key collection. Preparing counter-route.',
      'Your favourite shortcut has been compromised.',
      'Did you truly think that key came without a price?',
    ];
    const text = msgs[Math.floor(Math.random() * msgs.length)];
    return {
      id: ++this.messageCounter,
      text,
      type: 'mutation',
      timestamp: Date.now(),
    };
  }

  /**
   * Proposes and executes an adaptive maze rearrangement that maintains guaranteed solvability.
   */
  public triggerAdaptiveRearrangement(
    grid: number[][],
    playerPos: Position,
    remainingKeys: Position[],
    exitPos: Position,
    config: LevelConfig
  ): MutationResult | null {
    const height = grid.length;
    const width = grid[0].length;

    const predictedRoute = this.predictPlayerRoute(grid, playerPos, remainingKeys, exitPos);
    const predictedSet = new Set(predictedRoute.slice(2).map((p) => `${p.x},${p.y}`));

    // Find the player's most frequented visited cells + predicted forward cells
    const visitedEntries = Object.entries(this.visitedCounts)
      .map(([coord, count]) => {
        const [x, y] = coord.split(',').map(Number);
        const predictionBonus = predictedSet.has(coord) ? config.adaptiveAggression * 2 : 0;
        return { x, y, count, score: count + predictionBonus };
      })
      .filter((cell) => {
        if (cell.x === playerPos.x && cell.y === playerPos.y) return false;
        if (cell.x === exitPos.x && cell.y === exitPos.y) return false;
        if (remainingKeys.some((k) => k.x === cell.x && k.y === cell.y)) return false;
        return grid[cell.y][cell.x] === 0;
      })
      .sort((a, b) => b.score - a.score);

    // Also include predicted cells ahead if aggression >= 2
    if (config.adaptiveAggression >= 2) {
      for (const pred of predictedRoute.slice(2)) {
        const key = `${pred.x},${pred.y}`;
        if (
          !visitedEntries.some((v) => v.x === pred.x && v.y === pred.y) &&
          !(pred.x === exitPos.x && pred.y === exitPos.y) &&
          !remainingKeys.some((k) => k.x === pred.x && k.y === pred.y) &&
          grid[pred.y][pred.x] === 0
        ) {
          visitedEntries.push({ x: pred.x, y: pred.y, count: 1, score: config.adaptiveAggression + 1 });
        }
        void key;
      }
      visitedEntries.sort((a, b) => b.score - a.score);
    }

    // Candidates to open: interior wall cells (1) that connect two paths
    const wallCandidates: Position[] = [];
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        if (grid[y][x] === 1) {
          const horiz = grid[y][x - 1] === 0 && grid[y][x + 1] === 0;
          const vert = grid[y - 1][x] === 0 && grid[y + 1][x] === 0;
          if (horiz || vert) {
            wallCandidates.push({ x, y });
          }
        }
      }
    }

    const shuffledWalls = [...wallCandidates].sort(() => Math.random() - 0.5).slice(0, 24);
    const topVictims = visitedEntries.slice(0, 12);

    // Try closing player's favorite or predicted corridor while opening a bypass wall
    for (const victim of topVictims) {
      for (const openCandidate of shuffledWalls) {
        if (victim.x === openCandidate.x && victim.y === openCandidate.y) continue;

        const testGrid = grid.map((row) => [...row]);
        testGrid[openCandidate.y][openCandidate.x] = 0;
        testGrid[victim.y][victim.x] = 1;

        if (isMazeSolvable(testGrid, playerPos, remainingKeys, exitPos)) {
          grid[openCandidate.y][openCandidate.x] = 0;
          grid[victim.y][victim.x] = 1;

          const msgs = predictedSet.has(`${victim.x},${victim.y}`)
            ? [
                'I predicted that shortcut. Sealed and rerouted.',
                'Your favourite shortcut is gone.',
                'Predictable heading. Path neutralized.',
              ]
            : [
                'Your favourite shortcut is gone.',
                'I noticed you like this corridor. Not anymore.',
                'Route adapted. Re-routing required.',
                'The maze remembers where you tread.',
              ];
          const message = msgs[Math.floor(Math.random() * msgs.length)];

          return {
            closedWall: { x: victim.x, y: victim.y },
            openedWall: { x: openCandidate.x, y: openCandidate.y },
            message,
          };
        }
      }
    }

    // Fallback: If closing a cell isn't solvable, open an additional deceptive loop wall
    if (shuffledWalls.length > 0) {
      const openCandidate = shuffledWalls[0];
      grid[openCandidate.y][openCandidate.x] = 0;
      return {
        openedWall: openCandidate,
        message: 'A hidden corridor just collapsed open.',
      };
    }

    return null;
  }

  private calculateDominantDirection(): Direction {
    const entries = Object.entries(this.directionCounts) as [Direction, number][];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  public getFavouriteCorridor(): { key: string; count: number } {
    let bestKey = 'None';
    let max = 0;
    for (const [k, count] of Object.entries(this.visitedCounts)) {
      if (count > max) {
        max = count;
        bestKey = k;
      }
    }
    return { key: bestKey, count: max };
  }

  private evaluatePersonalityComment(
    pos: Position,
    prevCount: number,
    isOscillating: boolean,
    dir: Direction
  ): MazeMessage | undefined {
    const now = Date.now();
    // Throttle messages to at least 4.5 seconds apart unless something dramatic happens
    if (now - this.lastMessageTimestamp < 4500) {
      return undefined;
    }

    const suspicion = this.getSuspicion();
    let text = '';
    let type: MazeMessage['type'] = 'info';

    if (isOscillating && Math.random() < 0.75) {
      const oscMsgs = [
        'Indecision will not save you.',
        'Pacing back and forth? Unimpressive.',
        'Hesitation detected in your biometric pattern.',
      ];
      text = oscMsgs[Math.floor(Math.random() * oscMsgs.length)];
      type = 'warning';
    } else if (prevCount >= 4 && Math.random() < 0.65) {
      const repMsgs = [
        'Again? Really? You love this corridor.',
        'I noticed you like this corridor. I will remember that.',
        `Cell (${pos.x}, ${pos.y}) visited ${prevCount + 1} times. Fascinating attachment.`,
      ];
      text = repMsgs[Math.floor(Math.random() * repMsgs.length)];
      type = 'warning';
    } else if (suspicion >= 80 && Math.random() < 0.5) {
      const hostileMsgs = [
        'You think you know me?',
        'I remember every wrong turn you made.',
        'The architecture has evolved beyond your comprehension.',
        'There is no trust here. Only variables.',
      ];
      text = hostileMsgs[Math.floor(Math.random() * hostileMsgs.length)];
      type = 'hostile';
    } else if (this.directionCounts[dir] > 18 && Math.random() < 0.35) {
      const dirText = dir.toLowerCase();
      text = `You seem obsessively fond of heading ${dirText}. Predictable human.`;
      type = 'info';
    }

    if (text) {
      this.lastMessageTimestamp = now;
      return {
        id: ++this.messageCounter,
        text,
        type,
        timestamp: now,
      };
    }

    return undefined;
  }
}
