import type { Position, CatState, DogState, GhostState } from '../types/game';
import { findShortestPath, isWalkable } from './pathfinding';

export const GHOST_PHRASES = [
  'BOO! Wrong corridor!',
  'I live here. Pay rent!',
  'You cannot escape my haunting!',
  "Even I don't know this maze!",
  'Boo! Did I scare your whiskers?',
];

export function createInitialCat(spawn: Position, level: number): CatState {
  const speedMs = Math.max(330, 580 - (level - 1) * 55);
  return {
    pos: { ...spawn },
    stunnedUntil: 0,
    panicked: false,
    speedMs,
  };
}

export function createInitialDogs(spawns: Position[], level: number): DogState[] {
  const baseSpeed = Math.max(350, 590 - (level - 1) * 50);
  const templates: Array<{ name: string; emoji: string; speedOffset: number; mode: 'direct' | 'flank' }> = [
    { name: 'Rex', emoji: '🐶', speedOffset: 0, mode: 'direct' },
    { name: 'Barky', emoji: '🐕', speedOffset: -55, mode: 'direct' },
    { name: 'Zoomie', emoji: '🐩', speedOffset: 45, mode: 'flank' },
  ];

  return spawns.map((spawn, idx) => {
    const tpl = templates[idx % templates.length];
    return {
      id: `dog_${idx}`,
      name: tpl.name,
      emoji: tpl.emoji,
      pos: { ...spawn },
      speedMs: Math.max(320, baseSpeed + tpl.speedOffset),
      mode: tpl.mode,
    };
  });
}

export function createInitialGhost(spawn: Position, now: number): GhostState {
  return {
    pos: { ...spawn },
    visible: false,
    opacity: 0,
    lastToggleAt: now - 1500, // First appearance arrives ~2.5s after start
    phrase: 'BOO! SURPRISE!',
    target: { ...spawn },
    mode: 'haunt',
  };
}

const CARDINAL_OFFSETS: Position[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

function getValidNeighbors(grid: number[][], pos: Position): Position[] {
  const list: Position[] = [];
  for (const off of CARDINAL_OFFSETS) {
    const nx = pos.x + off.x;
    const ny = pos.y + off.y;
    if (isWalkable(grid, nx, ny)) {
      list.push({ x: nx, y: ny });
    }
  }
  return list;
}

/**
 * Advances Cat AI by 1 corridor step using BFS pathfinding.
 * Prioritizes catching the Rat, unless briefly panicked by Dogs catching up.
 */
export function computeNextCatPos(
  grid: number[][],
  cat: CatState,
  ratPos: Position,
  dogs: DogState[],
  now: number
): { nextPos: Position; panicked: boolean } {
  const isStunned = now < cat.stunnedUntil;
  const closeDogs = dogs.filter(
    (d) => Math.abs(d.pos.x - cat.pos.x) + Math.abs(d.pos.y - cat.pos.y) <= 2
  );
  const panicked = isStunned || closeDogs.length > 0;

  if (isStunned && closeDogs.length > 0) {
    // Funny panic dodge: step to a walkable neighbor maximizing distance from nearest dog
    const nearestDog = closeDogs[0];
    const neighbors = getValidNeighbors(grid, cat.pos);
    if (neighbors.length > 0) {
      neighbors.sort((a, b) => {
        const distA = Math.abs(a.x - nearestDog.pos.x) + Math.abs(a.y - nearestDog.pos.y);
        const distB = Math.abs(b.x - nearestDog.pos.x) + Math.abs(b.y - nearestDog.pos.y);
        return distB - distA;
      });
      return { nextPos: neighbors[0], panicked: true };
    }
    return { nextPos: cat.pos, panicked: true };
  }

  // Primary objective: BFS shortest corridor path toward Rat
  const path = findShortestPath(grid, cat.pos, ratPos);
  if (path && path.length >= 2) {
    return { nextPos: path[1], panicked };
  }

  return { nextPos: cat.pos, panicked };
}

/**
 * Advances a single Dog AI by 1 corridor step toward the Cat (NEVER chasing the Rat).
 * Prevents dogs from permanently stacking on identical tiles.
 */
export function computeNextDogPos(
  grid: number[][],
  dog: DogState,
  catPos: Position,
  otherDogs: DogState[]
): Position {
  let target = catPos;

  // Flanking dog targets an open neighbor next to the cat if possible so dogs surround the cat
  if (dog.mode === 'flank') {
    const catNeighbors = getValidNeighbors(grid, catPos);
    if (catNeighbors.length > 1) {
      const distToCat = Math.abs(dog.pos.x - catPos.x) + Math.abs(dog.pos.y - catPos.y);
      if (distToCat > 2) {
        target = catNeighbors[catNeighbors.length - 1];
      }
    }
  }

  const path = findShortestPath(grid, dog.pos, target) || findShortestPath(grid, dog.pos, catPos);
  if (path && path.length >= 2) {
    const candidate = path[1];
    const occupied = otherDogs.some(
      (other) => other.pos.x === candidate.x && other.pos.y === candidate.y
    );

    if (!occupied || (candidate.x === catPos.x && candidate.y === catPos.y)) {
      return candidate;
    }

    // Try an unoccupied walkable neighbor moving generally toward cat
    const altNeighbors = getValidNeighbors(grid, dog.pos).filter(
      (n) => !otherDogs.some((other) => other.pos.x === n.x && other.pos.y === n.y)
    );
    if (altNeighbors.length > 0) {
      altNeighbors.sort(
        (a, b) =>
          Math.abs(a.x - catPos.x) +
          Math.abs(a.y - catPos.y) -
          (Math.abs(b.x - catPos.x) + Math.abs(b.y - catPos.y))
      );
      return altNeighbors[0];
    }
  }

  return dog.pos;
}

/**
 * Moves the Ghost smoothly along corridors (with occasional playful wall phasing)
 * so it drifts around without trapping the rat.
 */
export function computeNextGhostPos(
  grid: number[][],
  ghost: GhostState,
  ratPos: Position
): { nextPos: Position; nextTarget: Position; nextMode: 'patrol' | 'haunt' } {
  const height = grid.length;
  const width = grid[0].length;

  let target = ghost.target;
  let mode = ghost.mode;

  // Periodically switch between haunting near the rat and patrolling corridors
  if (
    (ghost.pos.x === target.x && ghost.pos.y === target.y) ||
    Math.random() < 0.14
  ) {
    if (Math.random() < 0.55) {
      mode = 'haunt';
      target = ratPos;
    } else {
      mode = 'patrol';
      // Pick a walkable corridor cell
      for (let attempt = 0; attempt < 10; attempt++) {
        const rx = 1 + Math.floor(Math.random() * (width - 2));
        const ry = 1 + Math.floor(Math.random() * (height - 2));
        if (grid[ry][rx] === 0) {
          target = { x: rx, y: ry };
          break;
        }
      }
    }
  }

  // Prefer corridor path, occasionally phase through 1 wall like a true ghost
  const path = findShortestPath(grid, ghost.pos, target);
  if (path && path.length >= 2 && Math.random() > 0.22) {
    return { nextPos: path[1], nextTarget: target, nextMode: mode };
  }

  // Ghost step toward target within interior bounds (can float across walls)
  const dx = target.x - ghost.pos.x;
  const dy = target.y - ghost.pos.y;
  let nx = ghost.pos.x;
  let ny = ghost.pos.y;

  if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
    nx += dx > 0 ? 1 : -1;
  } else if (dy !== 0) {
    ny += dy > 0 ? 1 : -1;
  }

  nx = Math.max(1, Math.min(width - 2, nx));
  ny = Math.max(1, Math.min(height - 2, ny));

  return { nextPos: { x: nx, y: ny }, nextTarget: target, nextMode: mode };
}

/**
 * Picks an unexpected walkable corridor spawn for the Ghost near (but not on) the Rat.
 */
export function pickGhostAppearPos(grid: number[][], ratPos: Position): Position {
  const height = grid.length;
  const width = grid[0].length;
  const candidates: Position[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === 0) {
        const dist = Math.abs(x - ratPos.x) + Math.abs(y - ratPos.y);
        if (dist >= 3 && dist <= 7) {
          candidates.push({ x, y });
        }
      }
    }
  }

  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  return { x: Math.floor(width / 2), y: Math.floor(height / 2) };
}
