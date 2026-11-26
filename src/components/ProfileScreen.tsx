import React, { useState } from 'react';
import { Award, Check, Coins, Lock, Sparkles, UserCheck } from 'lucide-react';
import type { PlayerProfile } from '../types/game';
import { ACHIEVEMENTS, getPlayerRank } from '../systems/achievementManager';
import { RatMascot } from './RatMascot';

interface ProfileScreenProps {
  player: PlayerProfile;
  onSaveUsername: (username: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ player, onSaveUsername }) => {
  const [nameInput, setNameInput] = useState(player.username);
  const [savedNotice, setSavedNotice] = useState(false);

  const rankInfo = getPlayerRank(player.xp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUsername(nameInput);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Player Identity Card */}
      <section className="glass-panel-purple p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-purple-500/40">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <RatMascot size={104} />
          <div className="flex flex-col gap-2">
            <span className="text-xs font-['Orbitron'] uppercase text-purple-300 tracking-widest">
              PLAYER PROFILE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-['Orbitron'] text-white">
              {player.username}
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-bold">
                {rankInfo.rank} (Tier {rankInfo.tier})
              </span>
              <span className="flex items-center gap-1 text-purple-300">
                <Sparkles size={14} /> {player.xp} XP
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <Coins size={14} /> {player.coins} Coins
              </span>
            </div>

            <div className="w-full max-w-sm mt-1">
              <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-1">
                <span>Rank Progress</span>
                <span>
                  {rankInfo.nextRank
                    ? `${player.xp} / ${rankInfo.nextMinXp} XP → ${rankInfo.nextRank}`
                    : 'MAX RANK ACHIEVED'}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 border border-purple-400/30 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-emerald-400 to-amber-400"
                  style={{ width: `${rankInfo.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Username Edit Form */}
        <form
          onSubmit={handleSubmit}
          className="glass-panel p-4 flex flex-col gap-2.5 w-full md:w-72 border-emerald-500/30"
        >
          <label
            htmlFor="profile-username-input"
            className="text-xs font-['Orbitron'] text-emerald-300 uppercase tracking-wider flex items-center gap-1.5"
          >
            <UserCheck size={14} /> Update Runner Name
          </label>
          <div className="flex gap-2">
            <input
              id="profile-username-input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={24}
              placeholder="Enter username"
              className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-sm font-mono text-white focus:border-emerald-400 focus:outline-none"
            />
            <button
              type="submit"
              className="neon-button neon-button-green px-4 py-2 text-xs"
            >
              <Check size={14} />
              <span>Save</span>
            </button>
          </div>
          {savedNotice && (
            <span className="text-[11px] font-mono text-emerald-300">
              Username saved to player memory!
            </span>
          )}
        </form>
      </section>

      {/* Achievements Showcase */}
      <section className="glass-panel p-6 border-amber-500/30">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-black font-['Orbitron'] text-white flex items-center gap-2">
              <Award className="text-amber-400" size={20} />
              <span>ACHIEVEMENTS ({player.achievements.length} / {ACHIEVEMENTS.length})</span>
            </h3>
            <p className="text-xs text-gray-400 font-['Rajdhani']">
              Unlocked automatically through real gameplay accomplishments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = player.achievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                  unlocked
                    ? 'bg-emerald-950/30 border-emerald-400/50 shadow-[0_0_20px_rgba(57,255,20,0.12)]'
                    : 'bg-slate-950/65 border-white/10 opacity-70'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border ${
                    unlocked
                      ? 'bg-amber-500/20 border-amber-400'
                      : 'bg-slate-900 border-white/10 grayscale'
                  }`}
                >
                  {ach.icon}
                </div>

                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-['Orbitron'] font-bold text-sm text-white truncate">
                      {ach.title}
                    </h4>
                    {unlocked ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shrink-0">
                        UNLOCKED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-gray-400 flex items-center gap-1 shrink-0">
                        <Lock size={10} /> LOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 font-['Rajdhani'] leading-snug">
                    {ach.description}
                  </p>
                  <div className="text-[11px] font-mono text-amber-300 mt-1">
                    Reward: +{ach.xpBonus} XP · +{ach.coinBonus} 🪙
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
