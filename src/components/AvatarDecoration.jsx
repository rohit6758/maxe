import React from 'react';

export default function AvatarDecoration({ type, className = "" }) {
  if (!type || type === 'none') return null;

  return (
    <div className={`absolute inset-0 pointer-events-none z-20 scale-[1.35] ${className}`}>
      {type === 'neon-pulse' && (
        <div className="w-full h-full rounded-full border-[3px] border-transparent" style={{boxShadow: '0 0 15px var(--theme-primary), inset 0 0 15px var(--theme-primary)', animation: 'pulse 2s infinite'}} />
      )}
      {type === 'spinning-ring' && (
        <div className="w-full h-full rounded-full border-2 border-dashed border-primary" style={{animation: 'spin 4s linear infinite'}} />
      )}
      {type === 'fire-aura' && (
        <div className="w-full h-full rounded-full border-2 border-transparent relative">
          <div className="absolute inset-[-4px] rounded-full border-4 border-orange-500 opacity-50 blur-[2px]" style={{animation: 'pulse 1s infinite'}} />
          <div className="absolute inset-[-2px] rounded-full border-2 border-yellow-300 opacity-80" />
        </div>
      )}
      {type === 'skeleton-hands' && (
        <svg className="w-full h-full text-primary opacity-80 drop-shadow-md" viewBox="0 0 100 100" style={{animation: 'pulse 3s infinite'}}>
          {/* A crude representation of skeleton hands hugging the avatar */}
          <path d="M10 50 Q 5 15 40 10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M90 50 Q 95 15 60 10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M15 60 Q 0 40 25 25" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M85 60 Q 100 40 75 25" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}
