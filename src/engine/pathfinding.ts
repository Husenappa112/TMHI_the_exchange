import type { Position, Direction } from '../types/game';

/**
 * Checks if a coordinate is inside grid boundaries and is a walkable path (0).
 */
export function isWalkable(grid: number[][], x: number, y: number): boolean {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
    return false;
  }
  return grid[y][x] === 0;
}

/**
 * Breadth-First Search (BFS) to find the shortest path between start and end.
 * Returns an array of positions from start to target (inclusive), or null if unreachable.
 */
export function findShortestPath(
  grid: number[][],
  start: Position,
  target: Position
): Position[] | null {
  if (!isWalkable(grid, start.x, start.y) || !isWalkable(grid, target.x, target.y)) {
    return null;
  }
  if (start.x === target.x && start.y === target.y) {
    return [start];
  }

  const queue: Position[] = [start];
  const visited = new Set<string>();
  const parentMap = new Map<string, Position>();

  const startKey = `${start.x},${start.y}`;
  visited.add(startKey);

  const neighbors = [
    { x: 0, y: -1 }, // UP
    { x: 0, y: 1 },  // DOWN
    { x: -1, y: 0 }, // LEFT
    { x: 1, y: 0 },  // RIGHT
  ];

  let found = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === target.x && current.y === target.y) {
      found = true;
      break;
    }

    for (const offset of neighbors) {
      const nx = current.x + offset.x;
      const ny = current.y + offset.y;
      const key = `${nx},${ny}`;

      if (isWalkable(grid, nx, ny) && !visited.has(key)) {
        visited.add(key);
        parentMap.set(key, current);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  if (!found) {
    return null;
  }

  // Reconstruct path
  const path: Position[] = [];
  let curr: Position | undefined = target;
  while (curr) {
    path.push(curr);
    const key = `${curr.x},${curr.y}`;
    if (curr.x === start.x && curr.y === start.y) {
      break;
    }
    curr = parentMap.get(key);
  }

  return path.reverse();
}

/**
 * Returns all reachable coordinates from start position.
 */
export function getReachableSet(grid: number[][], start: Position): Set<string> {
  const reachable = new Set<string>();
  if (!isWalkable(grid, start.x, start.y)) return reachable;

  const queue: Position[] = [start];
  reachable.add(`${start.x},${start.y}`);

  const neighbors = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const offset of neighbors) {
      const nx = current.x + offset.x;
      const ny = current.y + offset.y;
      const key = `${nx},${ny}`;
      if (isWalkable(grid, nx, ny) && !reachable.has(key)) {
        reachable.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return reachable;
}

/**
 * Validates whether the player can reach all remaining keys and the exit.
 */
export function isMazeSolvable(
  grid: number[][],
  playerPos: Position,
  remainingKeys: Position[],
  exitPos: Position
): boolean {
  const reachable = getReachableSet(grid, playerPos);

  // Check if exit is reachable
  if (!reachable.has(`${exitPos.x},${exitPos.y}`)) {
    return false;
  }

  // Check if every remaining key is reachable
  for (const key of remainingKeys) {
    if (!reachable.has(`${key.x},${key.y}`)) {
      return false;
    }
  }

  return true;
}

/**
 * Predicts the player's next target or corridor based on recent trajectory.
 */
export function predictPlayerHeading(
  recentPositions: Position[],
  fallbackDirection: Direction
): Direction {
  if (recentPositions.length < 2) return fallbackDirection;

  const last = recentPositions[recentPositions.length - 1];
  const prev = recentPositions[recentPositions.length - 2];

  if (last.x > prev.x) return 'RIGHT';
  if (last.x < prev.x) return 'LEFT';
  if (last.y > prev.y) return 'DOWN';
  if (last.y < prev.y) return 'UP';

  return fallbackDirection;
}
