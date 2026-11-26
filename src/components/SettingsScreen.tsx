import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Eye,
  Check,
  AlertTriangle,
  Database,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type { PlayerSaveData, PlayerSettings } from '../types/game';
import { getStorageVerificationInfo } from '../systems/playerStorage';

interface SettingsScreenProps {
  saveData: PlayerSaveData;
  onUpdateSettings: (partial: Partial<PlayerSettings>) => void;
  onSaveUsername: (username: string) => void;
  onResetProgress: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  saveData,
  onUpdateSettings,
  onSaveUsername,
  onResetProgress,
}) => {
  const { player, settings } = saveData;
  const [nameInput, setNameInput] = useState(player.username);
  const [nameSaved, setNameSaved] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [verifyInfo, setVerifyInfo] = useState(() => getStorageVerificationInfo());

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUsername(nameInput);
    setNameSaved(true);
    setVerifyInfo(getStorageVerificationInfo());
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleConfirmReset = () => {
    onResetProgress();
    setConfirmingReset(false);
    setNameInput('Player');
    setResetSuccess(true);
    setVerifyInfo(getStorageVerificationInfo());
    setTimeout(() => setResetSuccess(false), 3000);
  };

  const handleVerifyStorage = () => {
    setVerifyInfo(getStorageVerificationInfo());
  };

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="glass-panel p-5 border-purple-500/30">
        <h2 className="text-2xl font-black font-['Orbitron'] text-white">
          SETTINGS & DATA MANAGEMENT
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 font-['Rajdhani']">
          Configure audio, runner identity, and inspect persistent localStorage memory.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Audio & Visual Toggles */}
        <section className="glass-panel p-5 flex flex-col gap-4 border-emerald-500/25">
          <h3 className="font-['Orbitron'] font-bold text-sm text-emerald-300 uppercase">
            Audio & Interface Controls
          </h3>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/75 border border-white/10">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="text-emerald-400" size={20} />
              ) : (
                <VolumeX className="text-rose-400" size={20} />
              )}
              <div>
                <div className="font-['Orbitron'] text-sm font-bold text-white">Sound Effects</div>
                <div className="text-xs text-gray-400">
                  Rat steps, cat meow, dog barks, ghost spook, cheese & key chimes
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              aria-pressed={settings.soundEnabled}
              className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold border cursor-pointer transition-all ${
                settings.soundEnabled
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-900 border-white/15 text-gray-400'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Music Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/75 border border-white/10">
            <div className="flex items-center gap-3">
              <Music
                className={settings.musicEnabled ? 'text-purple-400' : 'text-gray-500'}
                size={20}
              />
              <div>
                <div className="font-['Orbitron'] text-sm font-bold text-white">
                  Ambient Maze Music
                </div>
                <div className="text-xs text-gray-400">
                  Procedural cyberpunk synth drone during infiltration
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
              aria-pressed={settings.musicEnabled}
              className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold border cursor-pointer transition-all ${
                settings.musicEnabled
                  ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                  : 'bg-slate-900 border-white/15 text-gray-400'
              }`}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Heatmap Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/75 border border-white/10">
            <div className="flex items-center gap-3">
              <Eye className={settings.showHeatmap ? 'text-cyan-400' : 'text-gray-500'} size={20} />
              <div>
                <div className="font-['Orbitron'] text-sm font-bold text-white">
                  Memory Heatmap Trail
                </div>
                <div className="text-xs text-gray-400">
                  Show visited corridor glow and predicted AI dots
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ showHeatmap: !settings.showHeatmap })}
              aria-pressed={settings.showHeatmap}
              className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold border cursor-pointer transition-all ${
                settings.showHeatmap
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-slate-900 border-white/15 text-gray-400'
              }`}
            >
              {settings.showHeatmap ? 'ON' : 'OFF'}
            </button>
          </div>
        </section>

        {/* Username + Data Persistence + Safe Reset */}
        <section className="glass-panel p-5 flex flex-col justify-between gap-4 border-amber-500/25">
          {/* Username Edit */}
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-2">
            <label
              htmlFor="settings-username-input"
              className="font-['Orbitron'] font-bold text-sm text-amber-300 uppercase"
            >
              Player Username
            </label>
            <div className="flex gap-2">
              <input
                id="settings-username-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={24}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/20 text-sm font-mono text-white focus:border-emerald-400 focus:outline-none"
              />
              <button type="submit" className="neon-button neon-button-green px-4 py-2 text-xs">
                <Check size={14} />
                <span>SAVE</span>
              </button>
            </div>
            {nameSaved && (
              <span className="text-xs font-mono text-emerald-300">Username saved!</span>
            )}
          </form>

          {/* Persistence Verification */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col gap-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Database size={14} /> LOCALSTORAGE PERSISTENCE
              </span>
              <button
                type="button"
                onClick={handleVerifyStorage}
                className="px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 cursor-pointer"
              >
                Verify Now
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-gray-300">
              <span className="flex items-center gap-1 text-emerald-300">
                <ShieldCheck size={14} /> Status: {verifyInfo.integrity}
              </span>
              <span>Payload: {verifyInfo.bytes} bytes</span>
              <span>Wins Saved: {player.totalWins}</span>
            </div>
            <div className="text-gray-400">
              Last Saved Event:{' '}
              {verifyInfo.lastPlayed ? new Date(verifyInfo.lastPlayed).toLocaleString() : 'No runs saved yet'}
            </div>
          </div>

          {/* Safe Reset Progress */}
          <div className="pt-2 border-t border-white/10">
            {!confirmingReset ? (
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-gray-400 font-['Rajdhani']">
                  Erase all XP, coins, unlocked levels, achievements, and statistics.
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmingReset(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-['Orbitron'] font-bold text-xs bg-rose-500/15 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30 cursor-pointer shrink-0"
                >
                  <Trash2 size={14} />
                  <span>RESET PROGRESS</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/60 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-xs font-mono text-rose-200 font-bold">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                  <span>
                    Confirm permanent reset? All unlocked levels, XP, coins, and stats will be wiped.
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-mono bg-slate-900 border border-white/20 text-gray-200 hover:bg-slate-800 cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600 border border-rose-400 text-white hover:bg-rose-500 cursor-pointer"
                  >
                    CONFIRM RESET
                  </button>
                </div>
              </div>
            )}
            {resetSuccess && (
              <div className="text-xs font-mono text-amber-300 mt-2">
                Player progress has been safely reset to defaults.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
