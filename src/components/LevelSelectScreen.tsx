import React from 'react';
import { Lock, CheckCircle2, Play, Key, Clock, Trophy, Sparkles, Coins } from 'lucide-react';
import type { PlayerProfile } from '../types/game';
import { LEVEL_CONFIGS, TOTAL_LEVELS } from '../engine/mazeGenerator';

interface LevelSelectScreenProps {
  player: PlayerProfile;
  onStartLevel: (level: number) => void;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/15',
  Normal: 'text-cyan-300 border-cyan-400/40 bg-cyan-500/15',
  Challenging: 'text-amber-300 border-amber-400/40 bg-amber-500/15',
  Hard: 'text-purple-300 border-purple-400/40 bg-purple-500/15',
  Extreme: 'text-rose-300 border-rose-400/40 bg-rose-500/15',
};

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  player,
  onStartLevel,
}) => {
  const levelNumbers = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-3 border-purple-500/30">
        <div>
          <h2 className="text-2xl font-black font-['Orbitron'] text-white">
            SECTOR PROGRESSION (LEVELS 1–{TOTAL_LEVELS})
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 font-['Rajdhani']">
            Complete each sector to unlock the next challenge. Progress is saved automatically.
          </p>
        </div>
        <div className="text-xs font-mono bg-slate-950/75 border border-emerald-400/30 px-3 py-1.5 rounded-lg text-emerald-300">
          COMPLETED: {player.completedLevels.length} / {TOTAL_LEVELS}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {levelNumbers.map((lvl) => {
          const cfg = LEVEL_CONFIGS[lvl];
          const unlocked = player.unlockedLevels.includes(lvl);
          const completed = player.completedLevels.includes(lvl);
          const bestTime = player.bestTimeByLevel[lvl];
          const bestScore = player.bestScoreByLevel[lvl] || 0;

          return (
            <div
              key={lvl}
              className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                unlocked
                  ? completed
                    ? 'glass-panel border-emerald-400/50 shadow-[0_0_24px_rgba(57,255,20,0.12)]'
                    : 'glass-panel-purple border-purple-400/50 shadow-[0_0_24px_rgba(176,38,255,0.16)]'
                  : 'bg-slate-950/60 border-white/10 opacity-65'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="font-['Orbitron'] font-bold text-xs text-cyan-300">
                    LEVEL 0{lvl}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-['Orbitron'] font-bold uppercase border ${
                      DIFFICULTY_STYLES[cfg.difficulty] || ''
                    }`}
                  >
                    {cfg.difficulty}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-['Orbitron'] text-white mb-1">
                  {cfg.name.split(': ')[1]}
                </h3>
                <p className="text-xs text-gray-300 font-['Rajdhani'] leading-snug mb-3">
                  {cfg.description}
                </p>

                {/* Status Badge */}
                <div className="mb-3">
                  {completed ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-400/35 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 size={13} /> COMPLETED
                    </span>
                  ) : unlocked ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-300 bg-amber-500/15 border border-amber-400/35 px-2.5 py-0.5 rounded-full">
                      <Play size={12} /> UNLOCKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 bg-slate-900 border border-white/10 px-2.5 py-0.5 rounded-full">
                      <Lock size={12} /> LOCKED (Complete Level {lvl - 1})
                    </span>
                  )}
                </div>

                {/* Metrics & Rewards */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/75 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-1.5 text-yellow-300">
                    <Key size={13} /> {cfg.keysRequired} {cfg.keysRequired === 1 ? 'Key' : 'Keys'}
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <Clock size={13} /> {bestTime !== undefined ? `${bestTime.toFixed(1)}s` : '--'}
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <Trophy size={13} /> {bestScore > 0 ? `${bestScore} pts` : '--'}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <Sparkles size={13} /> +{cfg.xpReward} XP
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-300">
                  <Coins size={14} /> +{cfg.coinReward} Coins
                </div>

                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => onStartLevel(lvl)}
                    className="neon-button neon-button-green py-2 px-4 text-xs"
                  >
                    <Play size={14} />
                    <span>{completed ? 'REPLAY' : 'PLAY'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-['Orbitron'] bg-slate-900 text-gray-500 border border-white/10 cursor-not-allowed"
                  >
                    <Lock size={13} />
                    <span>LOCKED</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
