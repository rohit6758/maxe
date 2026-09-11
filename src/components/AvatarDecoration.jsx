import React from 'react';

export default function AvatarDecoration({ type, className = "" }) {
  if (!type || type === 'none') return null;

  return (
    <div className={`absolute inset-0 pointer-events-none z-20 scale-[1.35] ${className}`}>
      {type === 'neon-pulse' && (
        <div className="absolute inset-[-5px] rounded-full border-2 border-primary/70" style={{boxShadow: '0 0 0 3px color-mix(in srgb, var(--theme-primary) 12%, transparent)', animation: 'avatar-breathe 3s ease-in-out infinite'}} />
      )}
      {type === 'spinning-ring' && (
        <div className="absolute inset-[-6px] rounded-full border border-primary/40 border-t-primary border-r-transparent" style={{animation: 'spin 8s linear infinite'}} />
      )}
      {type === 'fire-aura' && (
        <div className="absolute inset-[-5px] rounded-full border border-amber-400/70">
          <div className="absolute inset-[-3px] rounded-full border border-orange-300/30" style={{animation: 'avatar-breathe 2.6s ease-in-out infinite'}} />
        </div>
      )}
      {type === 'skeleton-hands' && (
        <svg className="w-full h-full text-primary opacity-70" viewBox="0 0 100 100">
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
