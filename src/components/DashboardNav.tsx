import React from 'react';
import {
  LayoutDashboard,
  Map,
  User,
  BarChart3,
  Settings,
  HelpCircle,
  Coins,
  Sparkles,
} from 'lucide-react';
import type { PlayerProfile } from '../types/game';
import { getPlayerRank } from '../systems/achievementManager';

export type HubTab = 'dashboard' | 'levels' | 'profile' | 'stats' | 'settings';

interface DashboardNavProps {
  activeTab: HubTab;
  player: PlayerProfile;
  onSelectTab: (tab: HubTab) => void;
  onOpenHelp: () => void;
}

export const DashboardNav: React.FC<DashboardNavProps> = ({
  activeTab,
  player,
  onSelectTab,
  onOpenHelp,
}) => {
  const rankInfo = getPlayerRank(player.xp);

  const navItems: Array<{ id: HubTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { id: 'levels', label: 'Levels', icon: <Map size={15} /> },
    { id: 'profile', label: 'Profile', icon: <User size={15} /> },
    { id: 'stats', label: 'Statistics', icon: <BarChart3 size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
  ];

  return (
    <header className="glass-panel p-3 px-4 w-full flex flex-wrap items-center justify-between gap-3 border-purple-500/30">
      {/* Brand + Tab Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-2">
          <span className="text-xl" aria-hidden="true">🐭</span>
          <span className="font-['Orbitron'] font-black text-xs sm:text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-emerald-300 to-amber-300">
            MAZE OF BAD HABITS
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-1.5" aria-label="Dashboard Navigation">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['Orbitron'] font-bold tracking-wide transition-all cursor-pointer border ${
                  active
                    ? 'bg-purple-600/30 border-emerald-400 text-emerald-300 shadow-[0_0_14px_rgba(57,255,20,0.25)]'
                    : 'bg-slate-900/75 border-white/10 text-gray-300 hover:text-white hover:border-purple-400/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Player Quick Pill */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-900/90 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-mono">
          <span className="font-bold text-emerald-300">{player.username}</span>
          <span className="text-gray-500">|</span>
          <span className="text-purple-300">{rankInfo.rank}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-purple-950/60 border border-purple-400/30 px-2.5 py-1.5 rounded-lg text-xs font-mono text-purple-200">
          <Sparkles size={13} className="text-purple-400" />
          <span>{player.xp} XP</span>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-950/50 border border-amber-400/35 px-2.5 py-1.5 rounded-lg text-xs font-mono text-amber-300">
          <Coins size={13} className="text-amber-400" />
          <span>{player.coins}</span>
        </div>

        <button
          type="button"
          onClick={onOpenHelp}
          title="How To Play"
          className="p-2 rounded-lg border border-white/15 bg-slate-900/80 text-gray-300 hover:text-amber-300 hover:border-amber-400/40 transition-colors cursor-pointer"
        >
          <HelpCircle size={15} />
        </button>
      </div>
    </header>
  );
};
