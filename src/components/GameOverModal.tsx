import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  ArrowRight,
  Home,
  Clock,
  Footprints,
  ShieldAlert,
  Compass,
  AlertTriangle,
  Sparkles,
  Coins,
  Award,
} from 'lucide-react';
import type { SuspicionState, LevelConfig, AchievementDef } from '../types/game';
import { TOTAL_LEVELS } from '../engine/mazeGenerator';

interface GameOverModalProps {
  isVictory: boolean;
  outcomeTitle?: string;
  outcomeMessage?: string;
  score: number;
  isNewBestScore: boolean;
  xpEarned: number;
  coinsEarned: number;
  newlyUnlockedAchievements: AchievementDef[];
  timeElapsed: number;
  moves: number;
  suspicion: number;
  suspicionState: SuspicionState;
  favouriteCorridor: { key: string; count: number };
  levelConfig: LevelConfig;
  onNextLevel: () => void;
  onReplay: () => void;
  onReturnHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  outcomeTitle,
  outcomeMessage,
  score,
  isNewBestScore,
  xpEarned,
  coinsEarned,
  newlyUnlockedAchievements,
  timeElapsed,
  moves,
  suspicion,
  suspicionState,
  favouriteCorridor,
  levelConfig,
  onNextLevel,
  onReplay,
  onReturnHome,
}) => {
  useEffect(() => {
    if (isVictory) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#b026ff', '#39ff14', '#ffe600'],
        });
      } catch {}
    }
  }, [isVictory]);

  const mins = Math.floor(timeElapsed / 60);
  const secs = Math.floor(timeElapsed % 60);
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const hasNextLevel = levelConfig.level < TOTAL_LEVELS;

  return (
    <div className="modal-overlay">
      <div
        className={`glass-panel w-full max-w-lg p-6 sm:p-8 flex flex-col items-center text-center relative max-h-[92vh] overflow-y-auto ${
          isVictory
            ? 'border border-emerald-400/50 shadow-[0_0_50px_rgba(57,255,20,0.25)]'
            : 'border border-red-500/60 hostile-pulse'
        }`}
      >
        {/* Victory/Defeat Header */}
        <div className="mb-3">
          {isVictory ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 mx-auto mb-3 shadow-[0_0_20px_rgba(57,255,20,0.4)] animate-bounce">
              <Trophy size={32} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 mx-auto mb-3 shadow-[0_0_20px_rgba(255,42,85,0.4)] animate-pulse">
              <AlertTriangle size={32} />
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl font-black font-['Orbitron'] tracking-tight text-white mb-1">
            {outcomeTitle || (isVictory ? 'THE RAT WINS THIS ROUND!' : 'CAUGHT! CAT WINS!')}
          </h2>
          <p className="text-sm font-['Rajdhani'] font-medium text-gray-300">
            {outcomeMessage ||
              (isVictory
                ? 'You collected the keys, dodged the cat, and unlocked the next sector!'
                : 'Your saved levels and previous progress remain safely preserved.')}
          </p>
        </div>

        {/* Score & Rewards */}
        <div className="mb-4 flex flex-col items-center gap-2">
          <div
            className={`text-4xl sm:text-5xl font-black font-['Orbitron'] text-transparent bg-clip-text ${
              isVictory
                ? 'bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300'
                : 'bg-gradient-to-r from-red-400 via-orange-400 to-red-500'
            }`}
          >
            {isVictory ? `${score} PTS` : '0 PTS'}
          </div>
          {isVictory && isNewBestScore && (
            <span className="inline-block px-3 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-mono text-xs font-bold tracking-wider animate-pulse">
              NEW LEVEL RECORD!
            </span>
          )}
          <div className="flex items-center gap-3 text-xs font-mono mt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/20 border border-purple-400/40 text-purple-200">
              <Sparkles size={13} className="text-purple-400" /> +{xpEarned} XP
            </span>
            {coinsEarned > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200">
                <Coins size={13} className="text-amber-400" /> +{coinsEarned} Coins
              </span>
            )}
          </div>
        </div>

        {/* Newly Unlocked Achievements */}
        {newlyUnlockedAchievements.length > 0 && (
          <div className="w-full bg-amber-950/35 border border-amber-400/40 rounded-xl p-3 mb-4 text-left">
            <div className="text-[11px] font-['Orbitron'] text-amber-300 uppercase flex items-center gap-1.5 mb-2">
              <Award size={14} /> Achievement Unlocked!
            </div>
            <div className="flex flex-wrap gap-2">
              {newlyUnlockedAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-amber-400/35 text-xs font-mono text-white"
                >
                  <span>{ach.icon}</span>
                  <span className="font-bold text-amber-200">{ach.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memory Diagnostic Summary */}
        <div className="w-full bg-slate-950/60 rounded-xl p-4 border border-white/10 mb-5 text-left">
          <div className="font-['Orbitron'] text-xs uppercase text-cyan-400 tracking-wider mb-3">
            PSYCHO-DIAGNOSTIC TELEMETRY
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-gray-300">
              <Clock size={15} className="text-cyan-400" />
              <span>TIME: {formattedTime}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-300">
              <Footprints size={15} className="text-purple-400" />
              <span>MOVES: {moves}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-300">
              <ShieldAlert size={15} className="text-red-400" />
              <span>
                SUSPICION: {suspicion}% ({suspicionState})
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-300">
              <Compass size={15} className="text-yellow-400" />
              <span title={`Cell ${favouriteCorridor.key} visited ${favouriteCorridor.count} times`}>
                FAVORITE: {favouriteCorridor.key} ({favouriteCorridor.count}x)
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {isVictory && hasNextLevel && (
            <button
              type="button"
              onClick={onNextLevel}
              className="neon-button neon-button-green w-full flex-1 py-3 text-xs"
            >
              <span>NEXT LEVEL ({levelConfig.level + 1})</span>
              <ArrowRight size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={onReplay}
            className="neon-button neon-button-purple w-full flex-1 py-3 text-xs"
          >
            <RotateCcw size={16} />
            <span>{isVictory ? 'REPLAY' : 'RETRY'}</span>
          </button>

          <button
            type="button"
            onClick={onReturnHome}
            className="neon-button neon-button-subtle w-full sm:w-auto py-3 px-4 text-xs"
            title="Return to Dashboard"
          >
            <Home size={16} />
            <span>DASHBOARD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
