import React, { useEffect, useRef } from 'react';
import type {
  Position,
  KeyItem,
  CheeseItem,
  ShiftingWall,
  CatState,
  DogState,
  GhostState,
  FloatingBubble,
} from '../types/game';

interface MazeCanvasProps {
  grid: number[][];
  start: Position;
  player: Position;
  keys: KeyItem[];
  cheeses: CheeseItem[];
  exit: Position;
  exitUnlocked: boolean;
  visitedCounts: Record<string, number>;
  shiftingWalls: ShiftingWall[];
  cat: CatState;
  dogs: DogState[];
  ghost: GhostState;
  bubbles: FloatingBubble[];
  predictedPath?: Position[];
  showHeatmap?: boolean;
  onCanvasSwipe?: (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const MazeCanvas: React.FC<MazeCanvasProps> = ({
  grid,
  start,
  player,
  keys,
  cheeses,
  exit,
  exitUnlocked,
  visitedCounts,
  shiftingWalls,
  cat,
  dogs,
  ghost,
  bubbles,
  predictedPath = [],
  showHeatmap = true,
  onCanvasSwipe,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 520, height: 520 });

  // Latest state ref so render loop runs continuously without tearing down on every move
  const stateRef = useRef({
    grid,
    start,
    player,
    keys,
    cheeses,
    exit,
    exitUnlocked,
    visitedCounts,
    shiftingWalls,
    cat,
    dogs,
    ghost,
    bubbles,
    predictedPath,
    showHeatmap,
  });

  useEffect(() => {
    stateRef.current = {
      grid,
      start,
      player,
      keys,
      cheeses,
      exit,
      exitUnlocked,
      visitedCounts,
      shiftingWalls,
      cat,
      dogs,
      ghost,
      bubbles,
      predictedPath,
      showHeatmap,
    };
  }, [
    grid,
    start,
    player,
    keys,
    cheeses,
    exit,
    exitUnlocked,
    visitedCounts,
    shiftingWalls,
    cat,
    dogs,
    ghost,
    bubbles,
    predictedPath,
    showHeatmap,
  ]);

  // Smooth visual positions
  const visualRat = useRef<{ x: number; y: number }>({ x: player.x, y: player.y });
  const visualCat = useRef<{ x: number; y: number }>({ x: cat.pos.x, y: cat.pos.y });
  const visualDogs = useRef<Record<string, { x: number; y: number }>>({});
  const visualGhost = useRef<{ x: number; y: number }>({ x: ghost.pos.x, y: ghost.pos.y });

  const particles = useRef<Particle[]>([]);
  const animFrameId = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const spawnedSparksRef = useRef<Set<string>>(new Set());

  // Snap visual positions on major jumps (level reset) & spawn rat step sparks
  useEffect(() => {
    if (Math.hypot(player.x - visualRat.current.x, player.y - visualRat.current.y) > 2.5) {
      visualRat.current = { x: player.x, y: player.y };
    }
    for (let i = 0; i < 3; i++) {
      particles.current.push({
        x: player.x + 0.5,
        y: player.y + 0.5,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        life: 1,
        maxLife: 16 + Math.random() * 10,
        color: '#39ff14',
        size: 2 + Math.random() * 1.5,
      });
    }
  }, [player.x, player.y]);

  useEffect(() => {
    if (Math.hypot(cat.pos.x - visualCat.current.x, cat.pos.y - visualCat.current.y) > 3.5) {
      visualCat.current = { x: cat.pos.x, y: cat.pos.y };
    }
  }, [cat.pos.x, cat.pos.y]);

  useEffect(() => {
    if (Math.hypot(ghost.pos.x - visualGhost.current.x, ghost.pos.y - visualGhost.current.y) > 3.5) {
      visualGhost.current = { x: ghost.pos.x, y: ghost.pos.y };
    }
  }, [ghost.pos.x, ghost.pos.y, ghost.visible]);

  useEffect(() => {
    for (const sw of shiftingWalls) {
      const sparkKey = `${sw.x},${sw.y}-${sw.startTime}`;
      if (!spawnedSparksRef.current.has(sparkKey)) {
        spawnedSparksRef.current.add(sparkKey);
        const sparkColor = sw.type === 'closing' ? '#ff2a55' : '#00f0ff';
        for (let i = 0; i < 10; i++) {
          particles.current.push({
            x: sw.x + 0.5,
            y: sw.y + 0.5,
            vx: (Math.random() - 0.5) * 0.16,
            vy: (Math.random() - 0.5) * 0.16,
            life: 1,
            maxLife: 24 + Math.random() * 16,
            color: sparkColor,
            size: 2 + Math.random() * 2.5,
          });
        }
      }
    }
  }, [shiftingWalls]);

  // Observe container size safely outside requestAnimationFrame
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const clampedW = Math.min(Math.max(Math.floor(rect.width), 240), 1200);
      const clampedH = Math.min(Math.max(Math.floor(rect.height), 240), 900);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      sizeRef.current = { width: clampedW, height: clampedH };
      canvas.width = clampedW * dpr;
      canvas.height = clampedH * dpr;
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Main render loop (initialized once!)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    let lastTime = 0;

    const render = (now: number) => {
      if (!running) return;
      animFrameId.current = requestAnimationFrame(render);
      if (now - lastTime < 30) return;
      lastTime = now;

      timeRef.current += 0.08;
      const t = timeRef.current;

      const s = stateRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = sizeRef.current;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Smooth interpolation for all characters
      visualRat.current.x += (s.player.x - visualRat.current.x) * 0.36;
      visualRat.current.y += (s.player.y - visualRat.current.y) * 0.36;

      visualCat.current.x += (s.cat.pos.x - visualCat.current.x) * 0.3;
      visualCat.current.y += (s.cat.pos.y - visualCat.current.y) * 0.3;

      visualGhost.current.x += (s.ghost.pos.x - visualGhost.current.x) * 0.22;
      visualGhost.current.y += (s.ghost.pos.y - visualGhost.current.y) * 0.22;

      for (const dog of s.dogs) {
        if (!visualDogs.current[dog.id]) {
          visualDogs.current[dog.id] = { x: dog.pos.x, y: dog.pos.y };
        }
        const vd = visualDogs.current[dog.id];
        if (Math.hypot(dog.pos.x - vd.x, dog.pos.y - vd.y) > 3.5) {
          vd.x = dog.pos.x;
          vd.y = dog.pos.y;
        } else {
          vd.x += (dog.pos.x - vd.x) * 0.3;
          vd.y += (dog.pos.y - vd.y) * 0.3;
        }
      }

      const gridH = s.grid.length;
      const gridW = s.grid[0]?.length || 1;

      const padding = 14;
      const availW = Math.max(100, width - padding * 2);
      const availH = Math.max(100, height - padding * 2);
      const cellSize = Math.min(availW / gridW, availH / gridH);

      const offsetX = (width - gridW * cellSize) / 2;
      const offsetY = (height - gridH * cellSize) / 2;

      // Void background
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, width, height);

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Maze Grid
      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
          const px = offsetX + x * cellSize;
          const py = offsetY + y * cellSize;
          const isWall = s.grid[y][x] === 1;

          if (isWall) {
            ctx.fillStyle = '#0c132b';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
            ctx.fillStyle = 'rgba(176, 38, 255, 0.25)';
            ctx.fillRect(px + cellSize * 0.38, py + cellSize * 0.38, cellSize * 0.24, cellSize * 0.24);
          } else {
            ctx.fillStyle = '#040711';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(px, py, cellSize, cellSize);

            if (s.showHeatmap) {
              const visitCount = s.visitedCounts[`${x},${y}`] || 0;
              if (visitCount > 0) {
                ctx.fillStyle = `rgba(176, 38, 255, ${Math.min(0.5, visitCount * 0.1)})`;
                ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
                if (visitCount >= 3) {
                  ctx.fillStyle = `rgba(255, 42, 85, ${Math.min(0.4, (visitCount - 2) * 0.1)})`;
                  ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
                }
              }
            }
          }
        }
      }

      // Predicted route telemetry dots
      if (s.showHeatmap && s.predictedPath.length > 1) {
        for (let i = 1; i < Math.min(s.predictedPath.length, 6); i++) {
          const step = s.predictedPath[i];
          const sx = offsetX + step.x * cellSize + cellSize / 2;
          const sy = offsetY + step.y * cellSize + cellSize / 2;
          ctx.fillStyle = `rgba(255, 230, 0, ${0.3 - i * 0.04})`;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(2, cellSize * 0.09), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Start Beacon
      const startPx = offsetX + s.start.x * cellSize;
      const startPy = offsetY + s.start.y * cellSize;
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(startPx + 2, startPy + 2, cellSize - 4, cellSize - 4);
      ctx.fillStyle = 'rgba(57, 255, 20, 0.1)';
      ctx.fillRect(startPx + 2, startPy + 2, cellSize - 4, cellSize - 4);

      // Shifting Walls
      for (const sw of s.shiftingWalls) {
        const px = offsetX + sw.x * cellSize;
        const py = offsetY + sw.y * cellSize;
        const p = sw.progress;
        if (sw.type === 'closing') {
          ctx.fillStyle = `rgba(255, 42, 85, ${0.45 + Math.sin(t * 8) * 0.25})`;
          ctx.fillRect(px, py, cellSize, cellSize);
          ctx.strokeStyle = '#ffe600';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        } else {
          ctx.fillStyle = `rgba(0, 240, 255, ${Math.max(0.08, 0.6 - p * 0.55)})`;
          ctx.fillRect(px, py, cellSize, cellSize);
          ctx.strokeStyle = `rgba(57, 255, 20, ${Math.max(0.1, 0.8 - p * 0.7)})`;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        }
      }

      // Exit Portal
      const exitPx = offsetX + s.exit.x * cellSize + cellSize / 2;
      const exitPy = offsetY + s.exit.y * cellSize + cellSize / 2;
      const exitRadius = cellSize * 0.42;

      if (s.exitUnlocked) {
        ctx.fillStyle = 'rgba(57, 255, 20, 0.18)';
        ctx.beginPath();
        ctx.arc(exitPx, exitPy, exitRadius * 1.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(exitPx, exitPy, exitRadius, t * 1.4, t * 1.4 + Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(exitPx, exitPy, exitRadius * 0.65, -t * 2, -t * 2 + Math.PI * 1.2);
        ctx.stroke();

        ctx.fillStyle = '#39ff14';
        ctx.beginPath();
        ctx.arc(exitPx, exitPy, exitRadius * 0.32, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255, 42, 85, 0.14)';
        ctx.beginPath();
        ctx.arc(exitPx, exitPy, exitRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff2a55';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 + t * 0.3;
          const hx = exitPx + Math.cos(angle) * exitRadius;
          const hy = exitPy + Math.sin(angle) * exitRadius;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#ff2a55';
        ctx.fillRect(
          exitPx - cellSize * 0.12,
          exitPy - cellSize * 0.05,
          cellSize * 0.24,
          cellSize * 0.2
        );
        ctx.beginPath();
        ctx.arc(exitPx, exitPy - cellSize * 0.05, cellSize * 0.08, Math.PI, 0);
        ctx.stroke();
      }

      // Cheese Collectibles
      const itemFontSize = Math.max(11, Math.floor(cellSize * 0.62));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const ch of s.cheeses) {
        if (ch.collected) continue;
        const cx = offsetX + ch.x * cellSize + cellSize / 2;
        const cy = offsetY + ch.y * cellSize + cellSize / 2 + Math.sin(t * 2.5 + ch.x) * (cellSize * 0.06);

        ctx.fillStyle = 'rgba(255, 200, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(cx, cy, cellSize * 0.34, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `${itemFontSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        ctx.fillText('🧀', cx, cy + 1);
      }

      // Collectible Keys
      for (const k of s.keys) {
        if (k.collected) continue;
        const kx = offsetX + k.x * cellSize + cellSize / 2;
        const ky = offsetY + k.y * cellSize + cellSize / 2 + Math.sin(t * 2.8 + k.x) * (cellSize * 0.07);
        const kSize = cellSize * 0.38;

        ctx.fillStyle = 'rgba(255, 230, 0, 0.22)';
        ctx.beginPath();
        ctx.arc(kx, ky, kSize * 0.95, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(t * 1.2);
        ctx.strokeStyle = '#ffe600';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(-kSize / 2, -kSize / 2, kSize, kSize);
        ctx.restore();

        ctx.font = `${itemFontSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        ctx.fillText('🔑', kx, ky + 1);
      }

      // Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1 / p.maxLife;
        if (p.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }
        const px = offsetX + p.x * cellSize;
        const py = offsetY + p.y * cellSize;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      const spriteFont = Math.max(13, Math.floor(cellSize * 0.72));

      // --- 1. RAT (PLAYER) ---
      const ratPx = offsetX + visualRat.current.x * cellSize + cellSize / 2;
      const ratPy = offsetY + visualRat.current.y * cellSize + cellSize / 2 + Math.sin(t * 5) * (cellSize * 0.04);
      const ratRadius = Math.max(5, cellSize * 0.42);

      ctx.fillStyle = 'rgba(57, 255, 20, 0.22)';
      ctx.beginPath();
      ctx.arc(ratPx, ratPy, ratRadius * 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ratPx, ratPy, ratRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `${spriteFont}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.fillText('🐭', ratPx, ratPy + 1);

      // --- 2. DOGS (CHASING THE CAT!) ---
      s.dogs.forEach((dog, idx) => {
        const vd = visualDogs.current[dog.id] || dog.pos;
        const dogPx = offsetX + vd.x * cellSize + cellSize / 2;
        const dogPy =
          offsetY +
          vd.y * cellSize +
          cellSize / 2 +
          Math.abs(Math.sin(t * 5.5 + idx * 1.7)) * (-cellSize * 0.08);
        const dogRadius = Math.max(5, cellSize * 0.41);

        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.beginPath();
        ctx.arc(dogPx, dogPy, dogRadius * 1.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dogPx, dogPy, dogRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = `${spriteFont}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        ctx.fillText(dog.emoji, dogPx, dogPy + 1);
      });

      // --- 3. CAT (CHASING THE RAT, SCARED OF DOGS!) ---
      const catPx = offsetX + visualCat.current.x * cellSize + cellSize / 2;
      const catWobble = s.cat.panicked ? Math.sin(t * 14) * (cellSize * 0.08) : 0;
      const catPy =
        offsetY +
        visualCat.current.y * cellSize +
        cellSize / 2 +
        Math.sin(t * 4.5) * (cellSize * 0.05);
      const catRadius = Math.max(6, cellSize * 0.44);

      ctx.fillStyle = s.cat.panicked ? 'rgba(255, 165, 0, 0.34)' : 'rgba(255, 42, 85, 0.26)';
      ctx.beginPath();
      ctx.arc(catPx + catWobble, catPy, catRadius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = s.cat.panicked ? '#ffe600' : '#ff2a55';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(catPx + catWobble, catPy, catRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `${spriteFont}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.fillText(s.cat.panicked ? '🙀' : '🐱', catPx + catWobble, catPy + 1);

      if (s.cat.panicked) {
        ctx.font = `${Math.max(10, Math.floor(cellSize * 0.45))}px "Segoe UI Emoji", sans-serif`;
        ctx.fillText('💦', catPx + catRadius * 0.85, catPy - catRadius * 0.75);
      }

      // --- 4. VISIBLE GHOST (FLOATING & SPOOKY) ---
      if (s.ghost.visible || s.ghost.opacity > 0.02) {
        const ghostAlpha = Math.max(0, Math.min(1, s.ghost.opacity));
        const gx = offsetX + visualGhost.current.x * cellSize + cellSize / 2;
        const gy =
          offsetY +
          visualGhost.current.y * cellSize +
          cellSize / 2 +
          Math.sin(t * 2.4) * (cellSize * 0.14);
        const ghostRadius = Math.max(6, cellSize * 0.46);

        ctx.save();
        ctx.globalAlpha = ghostAlpha * 0.88;

        ctx.fillStyle = 'rgba(0, 240, 255, 0.22)';
        ctx.beginPath();
        ctx.arc(gx, gy, ghostRadius * 1.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e0f2fe';
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(gx, gy, ghostRadius, t, t + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = `${Math.floor(spriteFont * 1.08)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        ctx.fillText('👻', gx, gy + 1);

        // Spooky ghost caption when freshly manifested
        if (s.ghost.phrase && ghostAlpha > 0.5) {
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          const textW = ctx.measureText(s.ghost.phrase).width;
          const bx = Math.min(Math.max(gx, textW / 2 + 12), width - textW / 2 - 12);
          const by = Math.max(18, gy - ghostRadius - 12);

          ctx.fillStyle = 'rgba(12, 20, 44, 0.88)';
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(bx - textW / 2 - 7, by - 9, textW + 14, 18, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#e0f2fe';
          ctx.fillText(s.ghost.phrase, bx, by + 1);
        }

        ctx.restore();
      }

      // --- 5. FUNNY FLOATING EVENT SPEECH BUBBLES ---
      const currentWallMs = Date.now();
      for (const b of s.bubbles) {
        if (b.expiresAt <= currentWallMs) continue;
        const remainingRatio = Math.min(1, (b.expiresAt - currentWallMs) / 600);
        const bxRaw = offsetX + b.x * cellSize + cellSize / 2;
        const byRaw = offsetY + b.y * cellSize - cellSize * 0.55;

        ctx.save();
        ctx.globalAlpha = remainingRatio;
        ctx.font = 'bold 11px "Orbitron", "JetBrains Mono", sans-serif';
        const textW = ctx.measureText(b.text).width;
        const bx = Math.min(Math.max(bxRaw, textW / 2 + 14), width - textW / 2 - 14);
        const by = Math.max(20, Math.min(height - 20, byRaw));

        ctx.fillStyle = 'rgba(6, 10, 24, 0.94)';
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bx - textW / 2 - 9, by - 11, textW + 18, 22, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(b.text, bx, by + 1);
        ctx.restore();
      }

      ctx.restore();
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const minSwipeDist = 20;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipeDist) {
        onCanvasSwipe?.(dx > 0 ? 'RIGHT' : 'LEFT');
      }
    } else {
      if (Math.abs(dy) > minSwipeDist) {
        onCanvasSwipe?.(dy > 0 ? 'DOWN' : 'UP');
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[360px] sm:h-[480px] md:h-[540px] max-w-[760px] mx-auto overflow-hidden rounded-xl border border-cyan-500/25 bg-[#060913] shadow-[0_0_30px_rgba(0,240,255,0.08)]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full cursor-pointer" />
    </div>
  );
};
