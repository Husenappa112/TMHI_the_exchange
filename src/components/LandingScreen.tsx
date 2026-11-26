import React, { useState } from 'react';
import { Play, HelpCircle, Trophy, Brain, Zap, Key, Shield, ArrowRight } from 'lucide-react';
import { LEVEL_CONFIGS } from '../engine/mazeGenerator';
import type { PlayerStats } from '../types/game';
import { AnimatedMazeBg } from './AnimatedMazeBg';

interface LandingScreenProps {
  stats: PlayerStats;
  onStartGame: (level: number) => void;
  onOpenHelp: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  stats,
  onStartGame,
  onOpenHelp,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  const overallBestScore = Object.values(stats.bestScoreByLevel).reduce(
    (max, val) => (val > max ? val : max),
    0
  );

  return (
    <>
      <AnimatedMazeBg />
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[90vh] py-8 px-4 text-center">
        {/* Top Cyber Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 text-xs font-['Orbitron'] tracking-widest mb-4">
          <Brain size={14} className="animate-pulse" />
          <span>ADAPTIVE NEURAL LABYRINTH</span>
        </div>

        {/* Main Game Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-['Orbitron'] tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 mb-3 drop-shadow-[0_0_35px_rgba(0,240,255,0.4)]">
          THE MAZE HAS TRUST ISSUES
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-2xl font-['Rajdhani'] font-semibold text-gray-300 tracking-wide mb-8 max-w-2xl">
          "It remembers every wrong turn."
        </p>

        {/* Level Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8 text-left">
          {[1, 2, 3].map((lvl) => {
            const cfg = LEVEL_CONFIGS[lvl];
            const isSelected = selectedLevel === lvl;
            const bestScore = stats.bestScoreByLevel[lvl] || 0;
            const bestTime = stats.bestTimeByLevel[lvl];

            return (
              <button
                type="button"
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`text-left cursor-pointer transition-all duration-200 p-5 rounded-xl border ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/45 shadow-[0_0_25px_rgba(0,240,255,0.25)] scale-[1.02]'
                    : 'border-white/15 bg-slate-900/60 hover:border-cyan-500/40 hover:bg-slate-900/85'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Orbitron'] font-bold text-xs uppercase text-cyan-400">
                    LEVEL 0{lvl}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-yellow-400 font-mono">
                    <Key size={13} /> {cfg.keysRequired} {cfg.keysRequired === 1 ? 'KEY' : 'KEYS'}
                  </span>
                </div>

                <h3 className="font-['Orbitron'] text-base font-bold text-white mb-1">
                  {cfg.name.split(': ')[1]}
                </h3>
                <p className="text-xs text-gray-300 font-['Rajdhani'] mb-3 min-h-[36px] leading-snug">
                  {cfg.description}
                </p>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 font-mono">
                  <span>BEST: {bestScore > 0 ? `${bestScore} PTS` : '--'}</span>
                  <span>{bestTime ? `${bestTime.toFixed(1)}s` : '--'}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onStartGame(selectedLevel)}
            className="neon-button neon-button-cyan w-full sm:w-auto px-8 py-4 text-base"
          >
            <Play size={20} />
            <span>PLAY GAME — LEVEL 0{selectedLevel}</span>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            className="neon-button neon-button-purple w-full sm:w-auto px-6 py-4 text-base"
          >
            <HelpCircle size={20} />
            <span>HOW TO PLAY</span>
          </button>
        </div>

        {/* Global Best Score & Player Statistics Panel */}
        <div className="glass-panel p-4 px-6 w-full max-w-3xl flex flex-wrap items-center justify-around gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-yellow-300">
            <Trophy size={16} className="text-yellow-400" />
            <span>BEST SCORE: {overallBestScore > 0 ? `${overallBestScore} PTS` : '0 PTS'}</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300">
            <Trophy size={16} className="text-cyan-400" />
            <span>VICTORIES: {stats.victories} / {stats.gamesPlayed}</span>
          </div>
          <div className="flex items-center gap-2 text-purple-300">
            <Zap size={16} className="text-purple-400" />
            <span>TOTAL MOVES: {stats.totalMoves}</span>
          </div>
          {stats.favouriteCorridorTotal && (
            <div className="flex items-center gap-2 text-pink-300">
              <Shield size={16} className="text-pink-400" />
              <span>MOST VISITED TILE: ({stats.favouriteCorridorTotal})</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
