import type { Position, KeyItem, CheeseItem, LevelConfig } from '../types/game';
import { isMazeSolvable } from './pathfinding';

export interface GeneratedMaze {
  grid: number[][];
  width: number;
  height: number;
  start: Position;
  exit: Position;
  keys: KeyItem[];
  cheeses: CheeseItem[];
  catSpawn: Position;
  dogSpawns: Position[];
  ghostSpawn: Position;
}

export const TOTAL_LEVELS = 5;

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    level: 1,
    name: 'Sector 01: Naive Memory',
    difficulty: 'Easy',
    description: 'Small maze, basic memory. Outsmart the cat while two dogs keep it busy.',
    gridWidth: 15,
    gridHeight: 15,
    keysRequired: 1,
    braidFactor: 0.35,
    suspicionSensitivity: 1.0,
    shiftFrequency: 18,
    adaptiveAggression: 1,
    timeLimitSeconds: 120,
    targetTimeSeconds: 35,
    xpReward: 100,
    coinReward: 50,
  },
  2: {
    level: 2,
    name: 'Sector 02: Heightened Paranoia',
    difficulty: 'Normal',
    description: 'Larger corridors, 2 keys, and 3 dogs chasing a faster cat.',
    gridWidth: 19,
    gridHeight: 19,
    keysRequired: 2,
    braidFactor: 0.28,
    suspicionSensitivity: 1.3,
    shiftFrequency: 15,
    adaptiveAggression: 2,
    timeLimitSeconds: 160,
    targetTimeSeconds: 50,
    xpReward: 180,
    coinReward: 90,
  },
  3: {
    level: 3,
    name: 'Sector 03: Full Hostility',
    difficulty: 'Challenging',
    description: 'Tighter routes, 3 keys, and aggressive adaptive shortcuts.',
    gridWidth: 21,
    gridHeight: 21,
    keysRequired: 3,
    braidFactor: 0.24,
    suspicionSensitivity: 1.55,
    shiftFrequency: 12,
    adaptiveAggression: 2,
    timeLimitSeconds: 190,
    targetTimeSeconds: 65,
    xpReward: 260,
    coinReward: 130,
  },
  4: {
    level: 4,
    name: 'Sector 04: Recursive Trap',
    difficulty: 'Hard',
    description: 'Dense neural labyrinth with rapid wall morphs and relentless pursuit.',
    gridWidth: 25,
    gridHeight: 25,
    keysRequired: 3,
    braidFactor: 0.2,
    suspicionSensitivity: 1.8,
    shiftFrequency: 10,
    adaptiveAggression: 3,
    timeLimitSeconds: 220,
    targetTimeSeconds: 85,
    xpReward: 350,
    coinReward: 180,
  },
  5: {
    level: 5,
    name: 'Sector 05: Trust Issues Core',
    difficulty: 'Extreme',
    description: 'Maximum paranoia, 4 keys, frequent wall shifts, and full cartoon chaos.',
    gridWidth: 27,
    gridHeight: 27,
    keysRequired: 4,
    braidFactor: 0.18,
    suspicionSensitivity: 2.0,
    shiftFrequency: 9,
    adaptiveAggression: 3,
    timeLimitSeconds: 260,
    targetTimeSeconds: 105,
    xpReward: 500,
    coinReward: 250,
  },
};

/**
 * Procedurally generates a playable braided maze with keys and exit.
 */
export function generateMaze(config: LevelConfig, _seed?: number): GeneratedMaze {
  const width = config.gridWidth % 2 === 0 ? config.gridWidth + 1 : config.gridWidth;
  const height = config.gridHeight % 2 === 0 ? config.gridHeight + 1 : config.gridHeight;

  // Initialize grid with 1s (all walls)
  const grid: number[][] = Array.from({ length: height }, () => Array(width).fill(1));

  // Carve using Randomized Depth-First Search / Recursive Backtracker
  const startX = 1;
  const startY = 1;
  grid[startY][startX] = 0;

  const stack: Position[] = [{ x: startX, y: startY }];
  const directions = [
    { dx: 0, dy: -2 }, // Up
    { dx: 0, dy: 2 },  // Down
    { dx: -2, dy: 0 }, // Left
    { dx: 2, dy: 0 },  // Right
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];

    // Shuffle directions
    const shuffled = [...directions].sort(() => Math.random() - 0.5);
    let carved = false;

    for (const dir of shuffled) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && grid[ny][nx] === 1) {
        // Carve wall between
        grid[current.y + dir.dy / 2][current.x + dir.dx / 2] = 0;
        // Carve target cell
        grid[ny][nx] = 0;
        stack.push({ x: nx, y: ny });
        carved = true;
        break;
      }
    }

    if (!carved) {
      stack.pop();
    }
  }

  // Braid the maze: remove select interior walls to create loops and alternate routes
  // This is vital for player preference tracking and adaptive behavior.
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === 1) {
        // Check if removing this wall connects two opposite paths
        const horizontalBridge = grid[y][x - 1] === 0 && grid[y][x + 1] === 0;
        const verticalBridge = grid[y - 1][x] === 0 && grid[y + 1][x] === 0;

        if ((horizontalBridge || verticalBridge) && Math.random() < config.braidFactor * 0.4) {
          grid[y][x] = 0;
        }
      }
    }
  }

  const start: Position = { x: 1, y: 1 };
  const exit: Position = { x: width - 2, y: height - 2 };
  grid[start.y][start.x] = 0;
  grid[exit.y][exit.x] = 0;

  // Find all candidate floor locations for keys
  const floorCells: Position[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === 0) {
        // Distance check from start and exit
        const distFromStart = Math.hypot(x - start.x, y - start.y);
        const distFromExit = Math.hypot(x - exit.x, y - exit.y);
        if (distFromStart > 4 && distFromExit > 3) {
          floorCells.push({ x, y });
        }
      }
    }
  }

  // Distribute keys across different quadrants
  const keys: KeyItem[] = [];
  const quadrantFloors: Record<string, Position[]> = {
    TR: [], // top right
    BL: [], // bottom left
    BR: [], // bottom right
    TL: [], // top left
  };

  const midX = width / 2;
  const midY = height / 2;

  for (const cell of floorCells) {
    if (cell.x >= midX && cell.y < midY) quadrantFloors.TR.push(cell);
    else if (cell.x < midX && cell.y >= midY) quadrantFloors.BL.push(cell);
    else if (cell.x >= midX && cell.y >= midY) quadrantFloors.BR.push(cell);
    else quadrantFloors.TL.push(cell);
  }

  const quads = ['TR', 'BL', 'TL', 'BR'];
  let keyIndex = 0;

  for (let i = 0; i < config.keysRequired; i++) {
    const quadKey = quads[i % quads.length];
    let pool = quadrantFloors[quadKey];
    if (!pool || pool.length === 0) {
      pool = floorCells;
    }

    if (pool.length > 0) {
      const idxInPool = Math.floor(Math.random() * pool.length);
      const chosen = pool[idxInPool];
      keys.push({
        id: `key_${keyIndex++}`,
        x: chosen.x,
        y: chosen.y,
        collected: false,
      });
      pool.splice(idxInPool, 1);
      const pIdx = floorCells.indexOf(chosen);
      if (pIdx !== -1) floorCells.splice(pIdx, 1);
    } else {
      keys.push({
        id: `key_${keyIndex++}`,
        x: width - 3,
        y: 2,
        collected: false,
      });
    }
  }

  // Guaranteed reachability validation
  const keyPositions = keys.map((k) => ({ x: k.x, y: k.y }));
  if (!isMazeSolvable(grid, start, keyPositions, exit)) {
    for (const key of keys) {
      carveBypass(grid, start, { x: key.x, y: key.y });
    }
    carveBypass(grid, start, exit);
  }

  // Place Collectible Cheese slices along maze floors
  const cheeseCount = Math.min(8, 2 + config.level);
  const cheeses: CheeseItem[] = [];
  const shuffledCheeseCandidates = [...floorCells].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(cheeseCount, shuffledCheeseCandidates.length); i++) {
    const c = shuffledCheeseCandidates[i];
    cheeses.push({
      id: `cheese_${i}`,
      x: c.x,
      y: c.y,
      collected: false,
    });
  }

  // Spawn Cat far from Rat start so player gets breathing room
  const allWalkable: Position[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === 0 && !(x === start.x && y === start.y)) {
        allWalkable.push({ x, y });
      }
    }
  }

  const distantFromStart = allWalkable
    .filter((p) => Math.abs(p.x - start.x) + Math.abs(p.y - start.y) >= Math.floor((width + height) * 0.42))
    .sort(() => Math.random() - 0.5);
  const catSpawn: Position = distantFromStart[0] || exit;

  // Spawn 2-3 Dogs in walkable corridors away from Cat & Start
  const dogCount = config.level === 1 ? 2 : 3;
  const dogPool = allWalkable
    .filter(
      (p) =>
        Math.abs(p.x - catSpawn.x) + Math.abs(p.y - catSpawn.y) >= 4 &&
        Math.abs(p.x - start.x) + Math.abs(p.y - start.y) >= 4
    )
    .sort(() => Math.random() - 0.5);
  const dogSpawns: Position[] = [];
  for (let i = 0; i < dogCount; i++) {
    dogSpawns.push(dogPool[i] || allWalkable[i % allWalkable.length] || { x: width - 2, y: 1 });
  }

  // Ghost starts near center of maze
  const center = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  const ghostPool = allWalkable.sort(
    (a, b) =>
      Math.hypot(a.x - center.x, a.y - center.y) - Math.hypot(b.x - center.x, b.y - center.y)
  );
  const ghostSpawn: Position = ghostPool[0] || center;

  return {
    grid,
    width,
    height,
    start,
    exit,
    keys,
    cheeses,
    catSpawn,
    dogSpawns,
    ghostSpawn,
  };
}

/**
 * Carves a simple manhattan path between two points in emergency cases to ensure 100% solvability.
 */
function carveBypass(grid: number[][], from: Position, to: Position) {
  let cx = from.x;
  let cy = from.y;

  while (cx !== to.x) {
    grid[cy][cx] = 0;
    cx += cx < to.x ? 1 : -1;
  }
  while (cy !== to.y) {
    grid[cy][cx] = 0;
    cy += cy < to.y ? 1 : -1;
  }
  grid[to.y][to.x] = 0;
}
