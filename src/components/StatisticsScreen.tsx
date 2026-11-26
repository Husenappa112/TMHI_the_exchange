import React from 'react';
import { BarChart3, Trophy, Flame, Clock, Award, History } from 'lucide-react';
import type { PlayerSaveData } from '../types/game';
import { TOTAL_LEVELS, LEVEL_CONFIGS } from '../engine/mazeGenerator';
import { getComputedStatistics } from '../systems/statisticsManager';
import { ACHIEVEMENTS, getPlayerRank } from '../systems/achievementManager';

interface StatisticsScreenProps {
  saveData: PlayerSaveData;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ saveData }) => {
  const { player, recentGames } = saveData;
  const stats = getComputedStatistics(player);
  const rankInfo = getPlayerRank(player.xp);

  // SVG Donut calculation for Win/Loss Chart
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const winRatio = stats.totalGames > 0 ? stats.totalWins / stats.totalGames : 0;
  const winDash = winRatio * circumference;

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="glass-panel p-5 flex flex-wrap items-center justify-between gap-3 border-purple-500/30">
        <div>
          <h2 className="text-2xl font-black font-['Orbitron'] text-white flex items-center gap-2.5">
            <BarChart3 className="text-emerald-400" size={24} />
            <span>PLAYER STATISTICS & ANALYTICS</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 font-['Rajdhani']">
            Real-time career performance metrics stored persistently in your browser.
          </p>
        </div>
        <span className="text-xs font-mono text-purple-300 bg-purple-950/60 border border-purple-400/30 px-3 py-1.5 rounded-lg">
          LAST PLAYED: {player.lastPlayed ? new Date(player.lastPlayed).toLocaleString() : 'Never'}
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="glass-panel p-4 border-white/15">
          <div className="text-[11px] font-mono text-gray-400">TOTAL GAMES</div>
          <div className="text-2xl font-black font-['Orbitron'] text-white mt-1">{stats.totalGames}</div>
        </div>
        <div className="glass-panel p-4 border-emerald-500/25">
          <div className="text-[11px] font-mono text-gray-400">WINS / LOSSES</div>
          <div className="text-2xl font-black font-['Orbitron'] mt-1">
            <span className="text-emerald-400">{stats.totalWins}</span>
            <span className="text-gray-500 text-base"> / </span>
            <span className="text-rose-400">{stats.totalLosses}</span>
          </div>
        </div>
        <div className="glass-panel p-4 border-purple-500/25">
          <div className="text-[11px] font-mono text-gray-400">WIN RATE</div>
          <div className="text-2xl font-black font-['Orbitron'] text-purple-300 mt-1">
            {stats.winPercentage}%
          </div>
        </div>
        <div className="glass-panel p-4 border-cyan-500/25">
          <div className="text-[11px] font-mono text-gray-400">COMPLETION RATE</div>
          <div className="text-2xl font-black font-['Orbitron'] text-cyan-300 mt-1">
            {stats.completionRate}%
          </div>
        </div>
        <div className="glass-panel p-4 border-amber-500/25">
          <div className="text-[11px] font-mono text-gray-400">HIGHEST SCORE</div>
          <div className="text-2xl font-black font-['Orbitron'] text-amber-300 mt-1">
            {stats.highestScore}
          </div>
        </div>
      </div>

      {/* Secondary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <div className="text-[11px] font-mono text-gray-400">AVG WIN TIME</div>
            <div className="text-lg font-bold font-['Orbitron'] text-cyan-300">
              {stats.averageCompletionTime !== null
                ? `${stats.averageCompletionTime.toFixed(1)}s`
                : '--'}
            </div>
          </div>
          <Clock size={18} className="text-cyan-400" />
        </div>

        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <div className="text-[11px] font-mono text-gray-400">CHEESE COLLECTED</div>
            <div className="text-lg font-bold font-['Orbitron'] text-amber-300">
              🧀 {stats.cheeseCollected}
            </div>
          </div>
          <Trophy size={18} className="text-amber-400" />
        </div>

        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <div className="text-[11px] font-mono text-gray-400">CURRENT STREAK</div>
            <div className="text-lg font-bold font-['Orbitron'] text-emerald-300">
              {stats.currentStreak}
            </div>
          </div>
          <Flame size={18} className="text-orange-400" />
        </div>

        <div className="glass-panel p-4 flex items-center justify-between border-white/10">
          <div>
            <div className="text-[11px] font-mono text-gray-400">BEST STREAK</div>
            <div className="text-lg font-bold font-['Orbitron'] text-purple-300">
              {stats.bestStreak}
            </div>
          </div>
          <Award size={18} className="text-purple-400" />
        </div>
      </div>

      {/* Charts Row: Win/Loss Donut + Level & XP Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Win / Loss Chart */}
        <div className="glass-panel p-5 border-emerald-500/25 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={stats.totalGames > 0 ? '#f43f5e' : 'rgba(255,255,255,0.12)'}
                strokeWidth="14"
              />
              {stats.totalGames > 0 && (
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#39ff14"
                  strokeWidth="14"
                  strokeDasharray={`${winDash} ${circumference}`}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black font-['Orbitron'] text-white">
                {stats.winPercentage}%
              </span>
              <span className="text-[10px] font-mono text-gray-400">WIN RATE</span>
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col gap-3">
            <h3 className="font-['Orbitron'] font-bold text-sm text-white uppercase">
              Win / Loss Distribution
            </h3>
            <div className="w-full h-3.5 rounded-full bg-slate-950 border border-white/10 overflow-hidden flex">
              {stats.totalGames === 0 ? (
                <div className="w-full h-full bg-slate-800" />
              ) : (
                <>
                  <div
                    className="h-full bg-emerald-400 transition-all"
                    style={{ width: `${stats.winPercentage}%` }}
                  />
                  <div
                    className="h-full bg-rose-500 transition-all"
                    style={{ width: `${100 - stats.winPercentage}%` }}
                  />
                </>
              )}
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-300">■ Wins: {stats.totalWins}</span>
              <span className="text-rose-300">■ Losses: {stats.totalLosses}</span>
            </div>
            <div className="text-xs font-mono text-gray-400">
              Achievements: {player.achievements.length} / {ACHIEVEMENTS.length} unlocked (
              {Math.round((player.achievements.length / ACHIEVEMENTS.length) * 100)}%)
            </div>
          </div>
        </div>

        {/* Level Completion & XP Progress */}
        <div className="glass-panel p-5 border-purple-500/25 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="font-['Orbitron'] font-bold text-purple-300">
                LEVEL COMPLETION PROGRESS
              </span>
              <span className="text-emerald-300">
                {player.completedLevels.length} / {TOTAL_LEVELS}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const done = player.completedLevels.includes(lvl);
                const unlocked = player.unlockedLevels.includes(lvl);
                return (
                  <div
                    key={lvl}
                    className={`p-2 rounded-lg text-center font-mono text-xs border ${
                      done
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                        : unlocked
                        ? 'bg-purple-500/15 border-purple-400/40 text-purple-200'
                        : 'bg-slate-950/70 border-white/10 text-gray-500'
                    }`}
                  >
                    L{lvl} {done ? '✓' : unlocked ? '•' : '🔒'}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="font-['Orbitron'] font-bold text-amber-300">
                XP PROGRESSION ({rankInfo.rank})
              </span>
              <span className="text-amber-200">{player.xp} XP</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-950 border border-amber-400/30 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-emerald-400 to-amber-400"
                style={{ width: `${rankInfo.progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] font-mono text-gray-400 mt-1">
              Total Moves Recorded: {player.totalMoves} · Coins: {player.coins} 🪙
            </div>
          </div>
        </div>
      </div>

      {/* Recent Game History */}
      <div className="glass-panel p-5 border-white/15">
        <h3 className="font-['Orbitron'] font-bold text-sm text-white uppercase flex items-center gap-2 mb-3">
          <History size={16} className="text-cyan-400" />
          <span>Recent Game History</span>
        </h3>

        {recentGames.length === 0 ? (
          <div className="text-xs font-mono text-gray-400 py-4 text-center bg-slate-950/50 rounded-lg border border-white/5">
            No completed runs yet. Launch a level from the Dashboard or Level Select to begin recording telemetry!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="py-2 pr-3">LEVEL</th>
                  <th className="py-2 pr-3">RESULT</th>
                  <th className="py-2 pr-3">SCORE</th>
                  <th className="py-2 pr-3">TIME</th>
                  <th className="py-2 pr-3">MOVES</th>
                  <th className="py-2 pr-3">CHEESE</th>
                  <th className="py-2">REWARDS</th>
                </tr>
              </thead>
              <tbody>
                {recentGames.slice(0, 10).map((g) => (
                  <tr key={g.sessionId} className="border-b border-white/5 text-gray-200">
                    <td className="py-2 pr-3">
                      L{g.level} ({LEVEL_CONFIGS[g.level]?.difficulty || 'Sector'})
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          g.result === 'win'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                        }`}
                      >
                        {g.result.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-amber-300">{g.score}</td>
                    <td className="py-2 pr-3 text-cyan-300">{g.timeSeconds.toFixed(1)}s</td>
                    <td className="py-2 pr-3">{g.moves}</td>
                    <td className="py-2 pr-3">🧀 {g.cheeseCollected}</td>
                    <td className="py-2 text-purple-300">
                      +{g.xpEarned} XP / +{g.coinsEarned} 🪙
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
