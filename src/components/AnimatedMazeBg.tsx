import React from 'react';

export const AnimatedMazeBg: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60"
      aria-hidden="true"
    >
      {/* Subtle geometric maze pattern */}
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="maze-bg-pattern"
            width="96"
            height="96"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 0 24 H 48 V 72 H 24 M 72 0 V 48 H 96 M 48 48 H 72 V 96"
              fill="none"
              stroke="rgba(0, 240, 255, 0.12)"
              strokeWidth="1.5"
            />
            <rect
              x="16"
              y="16"
              width="12"
              height="12"
              fill="none"
              stroke="rgba(176, 38, 255, 0.14)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#maze-bg-pattern)" />
      </svg>

      {/* Lightweight GPU-composited drifting energy nodes */}
      <div className="maze-orb maze-orb-cyan" />
      <div className="maze-orb maze-orb-purple" />
      <div className="maze-orb maze-orb-green" />
    </div>
  );
};
