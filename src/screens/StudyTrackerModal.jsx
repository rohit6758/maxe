import React from 'react';
import { X, Flame, FileText, Bot, PlayCircle, CheckCircle, Brain, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import VerifiedBadge from '../components/VerifiedBadge';

export default function StudyTrackerModal({ isOpen, onClose }) {
  const [showHistory, setShowHistory] = React.useState(false);
  const { userProfile } = useAppContext();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center p-4 bg-background/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="card w-full max-w-md bg-surface shadow-2xl animate-slide-up flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-primary/20 flex justify-between items-center relative overflow-hidden">
          {userProfile?.is_premium && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5"></div>
          )}
          <div className="flex items-center gap-2 relative z-10">
            <h2 className="text-xl font-bold text-header flex items-center">
              Smart Study Tracker
              {userProfile?.is_premium && <VerifiedBadge className="w-5 h-5 ml-1 text-primary" />}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-primary/5 text-body hover:text-primary rounded-full relative z-10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!userProfile?.is_premium ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Flame size={32} className="text-primary opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-header mb-2">Maxe Pro Required</h3>
              <p className="text-sm text-body mb-6">Upgrade to unlock the Smart Study Tracker and start building your Duolingo-style study streaks!</p>
              <button onClick={onClose} className="bg-primary text-white font-bold px-6 py-2 rounded-xl text-sm shadow-md hover:bg-primary/90 transition-colors">
                Upgrade Now
              </button>
            </div>
          ) : showHistory ? (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-black/5 rounded-full">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h3 className="text-lg font-bold text-header">Digital Wellbeing</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { day: 'Today', hrs: 3.5, pct: 85 },
                  { day: 'Yesterday', hrs: 2.1, pct: 50 },
                  { day: 'Wed', hrs: 4.2, pct: 100 },
                  { day: 'Tue', hrs: 1.5, pct: 35 },
                  { day: 'Mon', hrs: 0.8, pct: 20 },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-16 text-xs font-bold text-body text-right">{d.day}</div>
                    <div className="flex-1 h-6 bg-black/5 border border-primary/10 rounded-full overflow-hidden flex items-center">
                      <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{width: `${d.pct}%`}}></div>
                    </div>
                    <div className="w-12 text-xs font-bold text-header">{d.hrs}h</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center text-body mt-8 opacity-70">This data represents the time you spent interacting with Maxe AI.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center pb-2 pt-4">
              <h4 className="text-xs font-bold text-header uppercase tracking-widest text-center mb-10">Daily Flow</h4>
              
              <div className="relative w-56 h-56 flex items-center justify-center">
                {/* SVG Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary/10" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset="56.54" strokeLinecap="round" className="animate-pulse" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--theme-primary)" />
                      <stop offset="100%" stopColor="var(--theme-accent)" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center Content */}
                <div className="text-center z-10 flex flex-col items-center">
                  <Flame size={32} className="text-[#FF9D00] drop-shadow-sm mb-1" />
                  <div className="text-5xl font-black text-header leading-none tracking-tight">12</div>
                  <p className="text-[10px] font-bold text-body uppercase tracking-wide mt-1">Day Streak</p>
                </div>

                {/* Orbiting Icons */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--theme-surface)] border-2 border-primary flex items-center justify-center shadow-md z-10" title="Read PDFs">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="absolute top-[14%] right-[4%] translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#FDF1E2] border-2 border-[#FF9D00] flex items-center justify-center shadow-md z-10" title="AI Chat">
                  <Bot size={18} className="text-[#FF9D00]" />
                </div>
                <div className="absolute bottom-[14%] right-[4%] translate-x-1/2 translate-y-1/2 w-10 h-10 rounded-full bg-[#F2D4D7] border-2 border-[#E11D48] flex items-center justify-center shadow-md z-10" title="Watched YT">
                  <PlayCircle size={18} className="text-[#E11D48]" />
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-10 h-10 rounded-full bg-[#F5EEDD] border-2 border-[#16587B] flex items-center justify-center shadow-md z-10" title="Research">
                  <BookOpen size={18} className="text-[#16587B]" />
                </div>
                <div className="absolute top-[50%] left-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md z-10" title="Goal Met">
                  <CheckCircle size={20} className="text-white" />
                </div>
              </div>

              <div className="mt-8 text-center cursor-pointer hover:bg-black/5 p-4 rounded-3xl transition-colors border border-primary/5 shadow-sm bg-surface" onClick={() => setShowHistory(true)}>
                <p className="text-xs font-bold text-body uppercase tracking-wider mb-2">AI Usage Today</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot size={20} className="text-primary" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-header">3.5</span>
                    <span className="text-sm font-bold text-body">hrs</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-primary mt-3 opacity-70 uppercase tracking-widest">Tap to view history</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
