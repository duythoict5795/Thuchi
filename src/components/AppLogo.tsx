import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function AppLogoIcon({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dimension = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 26 : 20;

  return (
    <div
      className={`${dimension} rounded-2xl flex items-center justify-center relative overflow-hidden shadow-md shadow-indigo-500/20 group select-none ${className}`}
      style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)',
      }}
    >
      {/* Decorative inner glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/30 pointer-events-none" />

      {/* Modern SVG Emblem */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 text-white drop-shadow-xs"
      >
        {/* Wallet Body Outline */}
        <path
          d="M3 8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V17C21 18.6569 19.6569 20 18 20H6C4.34315 20 3 18.6569 3 17V8Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Growth Trend / Coin Arrow */}
        <path
          d="M7 14L10.5 10.5L13 13L17 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.5 9H17V12.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Wallet Flap Accent */}
        <rect
          x="16"
          y="13"
          width="5"
          height="3"
          rx="1"
          fill="currentColor"
          className="text-amber-300"
        />
      </svg>
    </div>
  );
}

export function AppLogo({ size = 'md', showText = true, className = '' }: AppLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <AppLogoIcon size={size} />
      {showText && (
        <span className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
          Quản Lý Thu Chi
        </span>
      )}
    </div>
  );
}
