import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Map,
  BarChart3,
  Settings,
  Trophy,
  Flame,
  Clock,
  Coins,
  Award,
  Sparkles,
  Check,
  Pencil,
} from 'lucide-react';
import type { PlayerSaveData } from '../types/game';
import { LEVEL_CONFIGS } from '../engine/mazeGenerator';
import { ACHIEVEMENTS, getPlayerRank } from '../systems/achievementManager';
import { RatMascot } from './RatMascot';
import type { HubTab } from './DashboardNav';

interface DashboardScreenProps {
  saveData: PlayerSaveData;
  onContinueGame: () => void;
  onNewGame: () => void;
  onNavigateTab: (tab: HubTab) => void;
  onSaveUsername: (username: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  saveData,
  onContinueGame,
  onNewGame,
  onNavigateTab,
  onSaveUsername,
}) => {
  const { player } = saveData;
  const rankInfo = getPlayerRank(player.xp);
  const currentCfg = LEVEL_CONFIGS[player.currentLevel] || LEVEL_CONFIGS[1];

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(player.username);

  const handleConfirmName = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUsername(nameInput);
    setEditingName(false);
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Hero Banner */}
      <section className="glass-panel-purple p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 border border-purple-500/40 shadow-[0_0_40px_rgba(176,38,255,0.16)]">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <RatMascot size={116} />

          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[11px] font-['Orbitron'] font-bold tracking-widest">
                TIER {rankInfo.tier} · {rankInfo.rank.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[11px] font-mono">
                LEVEL {player.currentLevel} ACTIVE
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-['Orbitron'] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-emerald-300 to-amber-300">
              THE MAZE HAS TRUST ISSUES
            </h1>
            <p className="text-sm sm:text-base text-gray-300 font-['Rajdhani'] font-semibold">
              "It remembers every wrong turn." — Outrun the Cat, dodge the Ghost, let the Dogs cause chaos.
            </p>

            {/* Inline Player Username + XP Progress */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1">
              {editingName ? (
                <form onSubmit={handleConfirmName} className="inline-flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={24}
                    aria-label="Player Username"
                    className="px-3 py-1 rounded bg-slate-950 border border-emerald-400 text-sm font-mono text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-300 hover:bg-emerald-500/35 cursor-pointer"
                    title="Save Username"
                  >
                    <Check size={15} />
                  </button>
                </form>
              ) : (
                <div className="inline-flex items-center gap-2 bg-slate-950/75 border border-white/10 px-3 py-1 rounded-lg text-xs font-mono">
                  <span className="text-gray-400">RUNNER:</span>
                  <span className="text-emerald-300 font-bold">{player.username}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(player.username);
                      setEditingName(true);
                    }}
                    className="text-gray-400 hover:text-amber-300 cursor-pointer"
                    title="Edit Username"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs font-mono text-purple-200 min-w-[200px]">
                <Sparkles size={14} className="text-purple-400" />
                <span>{player.xp} XP</span>
                <div className="w-28 h-2 rounded-full bg-slate-950 border border-purple-400/30 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-emerald-400 to-amber-400 transition-all duration-300"
                    style={{ width: `${rankInfo.progressPercent}%` }}
                  />
                </div>
                {rankInfo.nextMinXp !== null && (
                  <span className="text-[10px] text-gray-400">/{rankInfo.nextMinXp}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Game Actions */}
        <div className="flex flex-col gap-3 w-full lg:w-auto min-w-[240px]">
          <button
            type="button"
            onClick={onContinueGame}
            className="neon-button neon-button-green w-full py-3.5 text-sm"
          >
            <Play size={18} />
            <span>CONTINUE — LEVEL {player.currentLevel}</span>
          </button>

          <button
            type="button"
            onClick={onNewGame}
            className="neon-button neon-button-amber w-full py-3 text-sm"
          >
            <RotateCcw size={17} />
            <span>NEW GAME (LEVEL 1)</span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('levels')}
              className="neon-button neon-button-purple px-2 py-2.5 text-[11px]"
            >
              <Map size={14} />
              <span>Levels</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('stats')}
              className="neon-button neon-button-subtle px-2 py-2.5 text-[11px]"
            >
              <BarChart3 size={14} />
              <span>Stats</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('settings')}
              className="neon-button neon-button-subtle px-2 py-2.5 text-[11px]"
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </section>

      {/* Real Player Stats Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 border-purple-500/25 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>TOTAL GAMES</span>
            <Trophy size={15} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black font-['Orbitron'] text-white">{player.totalGames}</div>
          <div className="text-xs font-mono text-gray-400">
            <span className="text-emerald-400">{player.totalWins}W</span> /{' '}
            <span className="text-rose-400">{player.totalLosses}L</span>
          </div>
        </div>

        <div className="glass-panel p-4 border-emerald-500/25 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>WIN PERCENTAGE</span>
            <Sparkles size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-['Orbitron'] text-emerald-300">
            {player.winPercentage}%
          </div>
          <div className="text-xs font-mono text-gray-400">
            Completed: {player.completedLevels.length} / 5 Lvls
          </div>
        </div>

        <div className="glass-panel p-4 border-amber-500/25 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>CHEESE & COINS</span>
            <Coins size={15} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black font-['Orbitron'] text-amber-300">
            🧀 {player.cheeseCollected}
          </div>
          <div className="text-xs font-mono text-amber-200/80">
            Coins Earned: {player.coins} 🪙
          </div>
        </div>

        <div className="glass-panel p-4 border-cyan-500/25 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>STREAK & BEST TIME</span>
            <Flame size={15} className="text-orange-400" />
          </div>
          <div className="text-2xl font-black font-['Orbitron'] text-cyan-300">
            {player.winningStreak}🔥
          </div>
          <div className="text-xs font-mono text-gray-400 flex items-center gap-1">
            <Clock size={12} />
            <span>
              Best: {player.bestTime !== null ? `${player.bestTime.toFixed(1)}s` : '--'}
            </span>
          </div>
        </div>
      </section>

      {/* Bottom Row: Current Sector Preview + Chase Lineup + Achievements Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Active Sector */}
        <div className="glass-panel p-5 flex flex-col justify-between gap-3 border-emerald-500/25">
          <div>
            <div className="text-[11px] font-['Orbitron'] uppercase text-emerald-400 tracking-wider mb-1">
              CURRENT SECTOR TARGET
            </div>
            <h3 className="text-lg font-bold font-['Orbitron'] text-white">{currentCfg.name}</h3>
            <p className="text-xs text-gray-300 font-['Rajdhani'] mt-1">{currentCfg.description}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-white/10 text-gray-300">
            <span>Difficulty: {currentCfg.difficulty}</span>
            <span className="text-amber-300">
              +{currentCfg.xpReward} XP / +{currentCfg.coinReward} 🪙
            </span>
          </div>
        </div>

        {/* Cartoon Chase Ecosystem Preview */}
        <div className="glass-panel p-5 flex flex-col justify-between gap-3 border-purple-500/25">
          <div className="text-[11px] font-['Orbitron'] uppercase text-purple-400 tracking-wider">
            CARTOON CHASE ECOSYSTEM
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950/75 rounded-lg p-2 border border-emerald-400/25">
              <div className="text-2xl">🐭</div>
              <div className="text-[10px] font-mono text-emerald-300 mt-1">RAT (YOU)</div>
            </div>
            <div className="bg-slate-950/75 rounded-lg p-2 border border-rose-400/25">
              <div className="text-2xl">🐱</div>
              <div className="text-[10px] font-mono text-rose-300 mt-1">CAT</div>
            </div>
            <div className="bg-slate-950/75 rounded-lg p-2 border border-sky-400/25">
              <div className="text-2xl">🐶</div>
              <div className="text-[10px] font-mono text-sky-300 mt-1">2-3 DOGS</div>
            </div>
            <div className="bg-slate-950/75 rounded-lg p-2 border border-cyan-300/25">
              <div className="text-2xl">👻</div>
              <div className="text-[10px] font-mono text-cyan-200 mt-1">GHOST</div>
            </div>
          </div>
          <div className="text-[11px] font-mono text-gray-400">
            Rat flees Cat → Dogs chase Cat → Ghost spooks everyone!
          </div>
        </div>

        {/* Achievements Preview */}
        <div className="glass-panel p-5 flex flex-col justify-between gap-3 border-amber-500/25">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-['Orbitron'] uppercase text-amber-400 tracking-wider">
              ACHIEVEMENTS
            </span>
            <span className="text-xs font-mono text-amber-300 flex items-center gap-1">
              <Award size={14} /> {player.achievements.length} / {ACHIEVEMENTS.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = player.achievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  title={`${ach.title}: ${ach.description}`}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border ${
                    unlocked
                      ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'bg-slate-950/70 border-white/10 opacity-35 grayscale'
                  }`}
                >
                  {ach.icon}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('profile')}
            className="text-left text-xs font-mono text-purple-300 hover:text-emerald-300 cursor-pointer"
          >
            View all achievements & profile →
          </button>
        </div>
      </section>
    </div>
  );
};
