import React from 'react';
import { X, Key, ShieldAlert, Zap, Compass, Cpu, CheckCircle } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="glass-panel w-full max-w-2xl p-6 sm:p-8 flex flex-col relative border border-cyan-400/40 shadow-[0_0_50px_rgba(0,240,255,0.25)] max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 bg-slate-900/80 border border-white/15 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl sm:text-3xl font-black font-['Orbitron'] text-cyan-400 mb-2 tracking-tight flex items-center gap-3">
          <Cpu className="text-cyan-400" />
          <span>NEURAL ARCHITECTURE INTEL</span>
        </h2>
        <p className="text-sm font-['Rajdhani'] font-semibold text-gray-300 mb-6">
          "The maze is not an environment. It is an observer."
        </p>

        {/* Intel Sections */}
        <div className="flex flex-col gap-5 text-left text-sm">
          {/* Section 1: Objective */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
            <h3 className="font-['Orbitron'] font-bold text-yellow-400 text-xs sm:text-sm uppercase mb-2 flex items-center gap-2">
              <Key size={16} /> 1. The Cartoon Chase & Objective
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              You are the <span className="text-emerald-300 font-bold">Rat (🐭)</span>! Collect all <span className="text-yellow-400 font-bold">Cyber Keys (🔑)</span> and bonus <span className="text-amber-300 font-bold">Cheese (🧀)</span> to unlock the exit portal. Meanwhile, a <span className="text-rose-400 font-bold">Cat (🐱)</span> hunts you, <span className="text-sky-300 font-bold">2–3 Dogs (🐶)</span> chase and panic the Cat, and a mischievous <span className="text-cyan-300 font-bold">Ghost (👻)</span> drifts around to spook you!
            </p>
          </div>

          {/* Section 2: Trust System */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
            <h3 className="font-['Orbitron'] font-bold text-purple-400 text-xs sm:text-sm uppercase mb-2 flex items-center gap-2">
              <ShieldAlert size={16} /> 2. The Suspicion & Memory Engine
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-2">
              Every step you take is indexed. The maze remembers:
            </p>
            <ul className="list-disc pl-5 text-xs text-gray-400 space-y-1 font-mono">
              <li><strong className="text-purple-300">Corridor Heatmaps:</strong> Frequently visited paths increase suspicion.</li>
              <li><strong className="text-purple-300">Oscillations:</strong> Pacing back and forth spikes paranoia immediately.</li>
              <li><strong className="text-purple-300">Directional Bias:</strong> Always turning right or left makes your path predictable.</li>
            </ul>
          </div>

          {/* Section 3: Adaptive Wall Morphing */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
            <h3 className="font-['Orbitron'] font-bold text-cyan-400 text-xs sm:text-sm uppercase mb-2 flex items-center gap-2">
              <Zap size={16} /> 3. Structural Rearrangement
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              When keys are collected or suspicion spikes, the maze <span className="text-cyan-400 font-bold">physically closes your favourite corridors</span> and forces detours. However, the pathfinding validator ensures the exit is <span className="text-green-400 font-bold">always mathematically solvable</span>. You are never unfairly trapped.
            </p>
          </div>

          {/* Section 4: Controls */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
            <h3 className="font-['Orbitron'] font-bold text-green-400 text-xs sm:text-sm uppercase mb-2 flex items-center gap-2">
              <Compass size={16} /> 4. Flight Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-cyan-400" />
                <span><strong>Desktop:</strong> Arrow Keys or WASD</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-cyan-400" />
                <span><strong>Mobile:</strong> Touch Swipe or Screen D-Pad</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="neon-button neon-button-cyan w-full py-3 mt-6 text-sm"
        >
          ACKNOWLEDGE & PROCEED
        </button>
      </div>
    </div>
  );
};
