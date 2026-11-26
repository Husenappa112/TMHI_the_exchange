import { describe, it, expect } from 'vitest';
import { findShortestPath, isMazeSolvable, predictPlayerHeading, isWalkable } from '../src/engine/pathfinding';
import { generateMaze, LEVEL_CONFIGS } from '../src/engine/mazeGenerator';
import { MazeMemoryEngine } from '../src/engine/adaptiveMemory';
import {
  createInitialCat,
  createInitialDogs,
  createInitialGhost,
  computeNextCatPos,
  computeNextDogPos,
  computeNextGhostPos,
  pickGhostAppearPos,
} from '../src/engine/characterAI';
import { calculateScore } from '../src/utils/storage';

describe('Pathfinding & Reachability', () => {
  it('finds shortest path in an open grid', () => {
    const grid = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];
    const path = findShortestPath(grid, { x: 0, y: 0 }, { x: 2, y: 2 });
    expect(path).not.toBeNull();
    expect(path!.length).toBe(5);
  });

  it('correctly reports blocked destination as null', () => {
    const grid = [
      [0, 1, 0],
      [1, 1, 0],
      [0, 0, 0],
    ];
    const path = findShortestPath(grid, { x: 0, y: 0 }, { x: 2, y: 2 });
    expect(path).toBeNull();
  });

  it('validates solvability for keys and exit', () => {
    const grid = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const solvable = isMazeSolvable(
      grid,
      { x: 0, y: 0 },
      [{ x: 1, y: 1 }],
      { x: 2, y: 2 }
    );
    expect(solvable).toBe(true);
  });

  it('predicts player heading from recent positions', () => {
    expect(
      predictPlayerHeading(
        [
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
        'DOWN'
      )
    ).toBe('RIGHT');
    expect(predictPlayerHeading([{ x: 1, y: 1 }], 'LEFT')).toBe('LEFT');
  });
});

describe('Maze Generator', () => {
  it('generates valid, solvable mazes across all three difficulty levels consistently', () => {
    for (const lvl of [1, 2, 3]) {
      const cfg = LEVEL_CONFIGS[lvl];
      for (let trial = 0; trial < 5; trial++) {
        const maze = generateMaze(cfg);
        expect(maze.width).toBe(cfg.gridWidth);
        expect(maze.height).toBe(cfg.gridHeight);
        expect(maze.keys.length).toBe(cfg.keysRequired);

        const solvable = isMazeSolvable(
          maze.grid,
          maze.start,
          maze.keys.map((k) => ({ x: k.x, y: k.y })),
          maze.exit
        );
        expect(solvable).toBe(true);
      }
    }
  });
});

describe('Adaptive Memory Engine', () => {
  it('tracks visited counts, recent directions, and suspicion states accurately', () => {
    const engine = new MazeMemoryEngine();
    const config = LEVEL_CONFIGS[1];
    expect(engine.getSuspicion()).toBe(10);
    expect(engine.getSuspicionState()).toBe('Watching');

    engine.recordMove({ x: 1, y: 1 }, { x: 2, y: 1 }, config);
    engine.recordMove({ x: 2, y: 1 }, { x: 3, y: 1 }, config);

    const memory1 = engine.getMemoryData();
    expect(memory1.visitedCounts['2,1']).toBe(1);
    expect(memory1.recentDirections).toEqual(['RIGHT', 'RIGHT']);

    // Oscillate repeatedly to climb through suspicion tiers
    for (let i = 0; i < 16; i++) {
      engine.recordMove({ x: 3, y: 1 }, { x: 2, y: 1 }, config);
      engine.recordMove({ x: 2, y: 1 }, { x: 3, y: 1 }, config);
    }

    expect(engine.getSuspicion()).toBeGreaterThanOrEqual(76);
    expect(engine.getSuspicionState()).toBe('Hostile');
    expect(engine.getMemoryData().oscillations).toBeGreaterThan(0);
  });

  it('predicts player route and executes multiple adaptive rearrangements without breaking solvability', () => {
    for (const lvl of [1, 2, 3]) {
      const engine = new MazeMemoryEngine();
      const config = LEVEL_CONFIGS[lvl];
      const maze = generateMaze(config);

      // Establish movement history along shortest path steps
      const keyPositions = maze.keys.map((k) => ({ x: k.x, y: k.y }));
      const predicted = engine.predictPlayerRoute(maze.grid, maze.start, keyPositions, maze.exit);
      expect(predicted.length).toBeGreaterThan(0);

      // Walk back and forth to trigger repeated-corridor memory
      if (predicted.length >= 2) {
        const nextCell = predicted[1];
        for (let i = 0; i < 4; i++) {
          engine.recordMove(maze.start, nextCell, config);
          engine.recordMove(nextCell, maze.start, config);
        }
      }

      // Run multiple consecutive mutations to verify maze never becomes impossible
      for (let m = 0; m < 3; m++) {
        const result = engine.triggerAdaptiveRearrangement(
          maze.grid,
          maze.start,
          keyPositions,
          maze.exit,
          config
        );
        expect(result).not.toBeNull();
        expect(isMazeSolvable(maze.grid, maze.start, keyPositions, maze.exit)).toBe(true);
      }
    }
  });

  it('calculates score deterministically', () => {
    const fastScore = calculateScore(1, 15, 20, 1, 2);
    const slowScore = calculateScore(1, 90, 120, 1, 0);
    expect(fastScore).toBeGreaterThan(slowScore);
    expect(calculateScore(1, 500, 500, 0, 0)).toBe(100);
  });
});

describe('Cartoon Chase AI (Rat -> Cat -> Dogs + Ghost)', () => {
  it('spawns cheeses, cat, 2-3 dogs, and ghost in valid maze cells', () => {
    const m1 = generateMaze(LEVEL_CONFIGS[1]);
    expect(m1.cheeses.length).toBeGreaterThanOrEqual(3);
    expect(m1.dogSpawns.length).toBe(2);
    expect(isWalkable(m1.grid, m1.catSpawn.x, m1.catSpawn.y)).toBe(true);
    expect(isWalkable(m1.grid, m1.ghostSpawn.x, m1.ghostSpawn.y)).toBe(true);

    const m2 = generateMaze(LEVEL_CONFIGS[2]);
    expect(m2.dogSpawns.length).toBe(3);

    const m3 = generateMaze(LEVEL_CONFIGS[3]);
    expect(m3.dogSpawns.length).toBe(3);
  });

  it('cat chases rat through valid corridors and speeds up on higher levels', () => {
    const maze = generateMaze(LEVEL_CONFIGS[1]);
    const cat1 = createInitialCat(maze.catSpawn, 1);
    const cat3 = createInitialCat(maze.catSpawn, 3);
    expect(cat3.speedMs).toBeLessThan(cat1.speedMs);

    const pathBefore = findShortestPath(maze.grid, cat1.pos, maze.start)!;
    const { nextPos } = computeNextCatPos(maze.grid, cat1, maze.start, [], Date.now());
    expect(isWalkable(maze.grid, nextPos.x, nextPos.y)).toBe(true);

    const pathAfter = findShortestPath(maze.grid, nextPos, maze.start)!;
    expect(pathAfter.length).toBe(pathBefore.length - 1);
  });

  it('dogs chase the cat (not the rat) and stay inside valid corridors', () => {
    const maze = generateMaze(LEVEL_CONFIGS[2]);
    const cat = createInitialCat(maze.catSpawn, 2);
    const dogs = createInitialDogs(maze.dogSpawns, 2);
    expect(dogs.length).toBe(3);

    const dog0 = dogs[0];
    const pathBefore = findShortestPath(maze.grid, dog0.pos, cat.pos)!;
    const nextPos = computeNextDogPos(maze.grid, dog0, cat.pos, dogs.slice(1));
    expect(isWalkable(maze.grid, nextPos.x, nextPos.y)).toBe(true);
    const pathAfter = findShortestPath(maze.grid, nextPos, cat.pos)!;
    expect(pathAfter.length).toBeLessThanOrEqual(pathBefore.length);
  });

  it('ghost appears inside maze bounds and moves without trapping the rat', () => {
    const maze = generateMaze(LEVEL_CONFIGS[1]);
    const appear = pickGhostAppearPos(maze.grid, maze.start);
    expect(isWalkable(maze.grid, appear.x, appear.y)).toBe(true);

    const ghost = createInitialGhost(appear, Date.now());
    const { nextPos } = computeNextGhostPos(maze.grid, ghost, maze.start);
    expect(nextPos.x).toBeGreaterThanOrEqual(1);
    expect(nextPos.x).toBeLessThan(maze.width - 1);
    expect(nextPos.y).toBeGreaterThanOrEqual(1);
    expect(nextPos.y).toBeLessThan(maze.height - 1);
  });
});
