import React from 'react';
import {
  ShieldAlert,
  Key,
  Clock,
  Footprints,
  Volume2,
  VolumeX,
  RotateCcw,
  Pause,
  Play,
  HelpCircle,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  History,
  Home,
} from 'lucide-react';
import type { SuspicionState, MazeMessage, LevelConfig, Direction } from '../types/game';

interface HUDProps {
  levelConfig: LevelConfig;
  keysCollected: number;
  keysRequired: number;
  cheesesCollected: number;
  cheesesTotal: number;
  catPanicked: boolean;
  dogCount: number;
  ghostVisible: boolean;
  liveScore: number;
  timeElapsed: number;
  timeRemaining: number;
  moves: number;
  suspicion: number;
  suspicionState: SuspicionState;
  recentDirections: Direction[];
  preferredDirection: Direction;
  favouriteCorridor: { key: string; count: number };
  activeMessage?: MazeMessage;
  isMuted: boolean;
  isPaused: boolean;
  showHeatmap: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onReturnHome: () => void;
  onOpenHelp: () => void;
  onToggleHeatmap: () => void;
}

const DIR_ARROW: Record<Direction, string> = {
  UP: '↑',
  DOWN: '↓',
  LEFT: '←',
  RIGHT: '→',
};

export const HUD: React.FC<HUDProps> = ({
  levelConfig,
  keysCollected,
  keysRequired,
  cheesesCollected,
  cheesesTotal,
  catPanicked,
  dogCount,
  ghostVisible,
  liveScore,
  timeElapsed,
  timeRemaining,
  moves,
  suspicion,
  suspicionState,
  recentDirections,
  preferredDirection,
  favouriteCorridor,
  activeMessage,
  isMuted,
  isPaused,
  showHeatmap,
  onToggleMute,
  onTogglePause,
  onRestart,
  onReturnHome,
  onOpenHelp,
  onToggleHeatmap,
}) => {
  const mins = Math.floor(timeElapsed / 60);
  const secs = Math.floor(timeElapsed % 60);
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const remMins = Math.floor(Math.max(0, timeRemaining) / 60);
  const remSecs = Math.floor(Math.max(0, timeRemaining) % 60);
  const formattedRemaining = `${String(remMins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  const isLowTime = timeRemaining <= 25;

  const keysLeft = Math.max(0, keysRequired - keysCollected);

  const getSuspicionColor = () => {
    switch (suspicionState) {
      case 'Watching':
        return '#39ff14';
      case 'Suspicious':
        return '#ffe600';
      case 'Manipulating':
        return '#b026ff';
      case 'Hostile':
        return '#ff2a55';
    }
  };

  const suspicionColor = getSuspicionColor();

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Top Main Status Bar */}
      <div className="glass-panel p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        {/* Left: Level, Keys & Score */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-cyan-400 font-['Orbitron'] text-xs sm:text-sm">
              LEVEL {levelConfig.level}
            </span>
            <span className="text-xs text-gray-400 hidden lg:inline">| {levelConfig.name}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold ${
              keysLeft === 0
                ? 'bg-green-500/15 border-green-400/50 text-green-300'
                : 'bg-yellow-500/10 border-yellow-500/35 text-yellow-300'
            }`}
          >
            <Key size={14} className={keysLeft > 0 ? 'text-yellow-400 animate-pulse' : 'text-green-400'} />
            <span>
              {keysLeft === 0
                ? `EXIT UNLOCKED (${keysCollected}/${keysRequired})`
                : `${keysLeft} LEFT (${keysCollected}/${keysRequired})`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-purple-950/50 border border-purple-500/30 px-2.5 py-1 rounded font-mono text-xs text-purple-200">
            <Trophy size={13} className="text-purple-400" />
            <span>{liveScore} PTS</span>
          </div>
        </div>

        {/* Center: Suspicion Meter */}
        <div className="flex items-center gap-3 min-w-[200px] flex-1 max-w-xs sm:max-w-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap" style={{ color: suspicionColor }}>
            {suspicionState === 'Hostile' ? (
              <Flame size={15} className="animate-bounce" />
            ) : (
              <ShieldAlert size={15} />
            )}
            <span className="tracking-wider uppercase font-['Orbitron']">
              {suspicionState} ({suspicion}%)
            </span>
          </div>

          <div className="suspicion-track flex-1">
            <div
              className={`suspicion-fill ${suspicionState === 'Hostile' ? 'hostile-pulse' : ''}`}
              style={{
                width: `${suspicion}%`,
                backgroundColor: suspicionColor,
                boxShadow: `0 0 10px ${suspicionColor}`,
              }}
            />
          </div>
        </div>

        {/* Right: Timer, Moves, Quick Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded border ${
              isLowTime
                ? 'bg-red-950/60 border-red-500/50 text-red-300 animate-pulse'
                : 'bg-cyan-950/50 border-cyan-500/25 text-cyan-300'
            }`}
            title={`Elapsed: ${formattedTime} | Lockdown Countdown: ${formattedRemaining}`}
          >
            <Clock size={14} />
            <span>{formattedTime}</span>
            <span className="text-[10px] text-gray-400 hidden sm:inline">(-{formattedRemaining})</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-gray-200 text-xs bg-slate-900/80 px-2.5 py-1 rounded border border-white/15">
            <Footprints size={14} className="text-purple-400" />
            <span>{moves}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleHeatmap}
              title={showHeatmap ? 'Hide Trust Trail' : 'Show Trust Trail'}
              className={`p-2 rounded border transition-colors cursor-pointer ${
                showHeatmap
                  ? 'border-purple-500/70 text-purple-300 bg-purple-950/60'
                  : 'border-white/15 bg-slate-900/80 text-gray-400 hover:text-white'
              }`}
            >
              <Eye size={15} />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-2 rounded border border-white/15 bg-slate-900/80 text-gray-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <button
              type="button"
              onClick={onTogglePause}
              title={isPaused ? 'Resume Game' : 'Pause Game'}
              className="p-2 rounded border border-white/15 bg-slate-900/80 text-gray-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors cursor-pointer"
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
            </button>

            <button
              type="button"
              onClick={onRestart}
              title="Restart Level"
              className="p-2 rounded border border-white/15 bg-slate-900/80 text-gray-300 hover:text-red-400 hover:border-red-500/40 transition-colors cursor-pointer"
            >
              <RotateCcw size={15} />
            </button>

            <button
              type="button"
              onClick={onOpenHelp}
              title="How To Play"
              className="p-2 rounded border border-white/15 bg-slate-900/80 text-gray-300 hover:text-yellow-400 hover:border-yellow-500/40 transition-colors cursor-pointer"
            >
              <HelpCircle size={15} />
            </button>

            <button
              type="button"
              onClick={onReturnHome}
              title="Main Menu"
              className="p-2 rounded border border-white/15 bg-slate-900/80 text-gray-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors cursor-pointer"
            >
              <Home size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Second Row: Maze AI Dialogue + Live Movement History Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        <div className="lg:col-span-2 ai-dialogue-panel p-2.5 px-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="font-mono font-semibold text-cyan-400 tracking-wide shrink-0">MAZE AI:</span>
            <span className="text-gray-100 italic font-mono tracking-tight truncate">
              "{activeMessage?.text || 'Observing neural footsteps...'}"
            </span>
          </div>
          {activeMessage && (
            <span
              className="text-[10px] uppercase font-['Orbitron'] font-bold px-2 py-0.5 rounded border shrink-0"
              style={{
                borderColor: suspicionColor,
                color: suspicionColor,
              }}
            >
              {activeMessage.type}
            </span>
          )}
        </div>

        {/* Live Movement History Telemetry */}
        <div className="glass-panel p-2 px-3 flex items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-purple-300 shrink-0">
            <History size={14} className="text-purple-400" />
            <span className="text-[11px] uppercase text-gray-400">HISTORY:</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-300 tracking-widest overflow-hidden">
            {recentDirections.length === 0 ? (
              <span className="text-gray-500">--</span>
            ) : (
              recentDirections.slice(-8).map((d, idx) => (
                <span
                  key={idx}
                  className={idx === Math.min(7, recentDirections.length - 1) ? 'text-green-400 font-bold' : 'opacity-75'}
                >
                  {DIR_ARROW[d]}
                </span>
              ))
            )}
          </div>
          <span
            className="text-[10px] text-gray-400 shrink-0 hidden sm:inline"
            title={`Most visited corridor: (${favouriteCorridor.key}) ${favouriteCorridor.count}x`}
          >
            BIAS:{DIR_ARROW[preferredDirection]}
          </span>
        </div>
      </div>

      {/* Compact Character Chase Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 glass-panel text-[11px] font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-green-300 font-semibold">🐭 YOU: RAT</span>
          <span className="text-yellow-300">
            🧀 CHEESE: {cheesesCollected}/{cheesesTotal}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={catPanicked ? 'text-yellow-300 font-bold animate-pulse' : 'text-rose-300'}>
            {catPanicked ? '🙀 CAT: PANICKING!' : '🐱 CAT: CHASING YOU'}
          </span>
          <span className="text-sky-300">
            🐶 DOGS ({dogCount}): CHASING CAT
          </span>
          <span className={ghostVisible ? 'text-cyan-200 font-bold animate-pulse' : 'text-gray-400'}>
            👻 GHOST: {ghostVisible ? 'HAUNTING!' : 'LURKING'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const TouchControls: React.FC<{ onMove: (direction: Direction) => void }> = ({ onMove }) => (
  <div className="flex justify-center md:hidden pt-1 pb-2">
    <div className="grid grid-cols-3 gap-2 w-44">
      <div />
      <button
        type="button"
        onClick={() => onMove('UP')}
        className="dpad-btn mx-auto"
        aria-label="Move Up"
      >
        <ChevronUp size={26} />
      </button>
      <div />

      <button
        type="button"
        onClick={() => onMove('LEFT')}
        className="dpad-btn mx-auto"
        aria-label="Move Left"
      >
        <ChevronLeft size={26} />
      </button>
      <button
        type="button"
        onClick={() => onMove('DOWN')}
        className="dpad-btn mx-auto"
        aria-label="Move Down"
      >
        <ChevronDown size={26} />
      </button>
      <button
        type="button"
        onClick={() => onMove('RIGHT')}
        className="dpad-btn mx-auto"
        aria-label="Move Right"
      >
        <ChevronRight size={26} />
      </button>
    </div>
  </div>
);
