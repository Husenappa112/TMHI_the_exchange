import React from 'react';

export const RatMascot: React.FC<{ size?: number }> = ({ size = 112 }) => {
  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-purple-600/35 via-emerald-500/20 to-amber-400/30 border border-purple-400/50 shadow-[0_0_25px_rgba(176,38,255,0.35)]" />
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="relative z-10 mascot-bob"
        aria-label="Animated Rat Mascot"
      >
        {/* Left & Right Ears */}
        <circle cx="34" cy="36" r="18" fill="#1e1b4b" stroke="#b026ff" strokeWidth="3" />
        <circle cx="34" cy="36" r="10" fill="#a855f7" opacity="0.55" />
        <circle cx="86" cy="36" r="18" fill="#1e1b4b" stroke="#b026ff" strokeWidth="3" />
        <circle cx="86" cy="36" r="10" fill="#a855f7" opacity="0.55" />

        {/* Head */}
        <ellipse cx="60" cy="64" rx="30" ry="26" fill="#0f172a" stroke="#39ff14" strokeWidth="2.8" />

        {/* Glowing Eyes */}
        <circle cx="48" cy="57" r="5.5" fill="#040711" stroke="#39ff14" strokeWidth="1.5" />
        <circle cx="49" cy="56" r="2.2" fill="#39ff14" />
        <circle cx="72" cy="57" r="5.5" fill="#040711" stroke="#39ff14" strokeWidth="1.5" />
        <circle cx="73" cy="56" r="2.2" fill="#39ff14" />

        {/* Nose */}
        <ellipse cx="60" cy="70" rx="5" ry="3.8" fill="#f59e0b" />

        {/* Smile */}
        <path
          d="M 52 76 Q 60 82 68 76"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Whiskers */}
        <path
          d="M 24 64 L 40 67 M 23 72 L 40 72 M 96 64 L 80 67 M 97 72 L 80 72"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Mini Glowing Cheese Badge */}
        <polygon points="82,82 104,88 88,104" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="91" cy="92" r="2" fill="#78350f" />
        <circle cx="96" cy="95" r="1.5" fill="#78350f" />
      </svg>
    </div>
  );
};
