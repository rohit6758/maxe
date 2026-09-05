import React from 'react';
import { X, Flame, FileText, Bot, PlayCircle, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import VerifiedBadge from '../components/VerifiedBadge';

export default function StudyTrackerModal({ isOpen, onClose }) {
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
          ) : (
            <div className="space-y-6 relative">
              
              {/* Streak Header */}
              <div className="flex items-center justify-center gap-3">
                <Flame size={40} className="text-[#FF9D00] drop-shadow-md animate-pulse" />
                <div>
                  <div className="text-4xl font-black text-header">12 <span className="text-xl text-body font-bold">Days</span></div>
                  <p className="text-xs font-bold text-[#FF9D00] uppercase tracking-wide">Current Streak</p>
                </div>
              </div>

              {/* Flowchart Diagram */}
              <div className="mt-8 border border-primary/20 rounded-2xl p-6 bg-background/30 relative">
                <h4 className="text-xs font-bold text-header uppercase tracking-widest text-center mb-6">Today's Flow</h4>
                
                <div className="flex flex-col items-center gap-2 relative">
                  
                  {/* Vertical Line */}
                  <div className="absolute top-8 bottom-8 left-1/2 w-0.5 bg-primary/20 -translate-x-1/2"></div>
                  
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-1 z-10 relative bg-surface p-2 rounded-full border-2 border-primary shadow-sm hover:scale-105 transition-transform">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText size={20} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-body">Read PDFs (2h)</span>
                  </div>
                  
                  <div className="h-6"></div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-1 z-10 relative bg-surface p-2 rounded-full border-2 border-[#84B3CE] shadow-sm hover:scale-105 transition-transform">
                    <div className="w-10 h-10 rounded-full bg-[#84B3CE]/10 flex items-center justify-center">
                      <PlayCircle size={20} className="text-[#84B3CE]" />
                    </div>
                    <span className="text-[10px] font-bold text-body">Watched YT (45m)</span>
                  </div>

                  <div className="h-6"></div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-1 z-10 relative bg-surface p-2 rounded-full border-2 border-[#FFD5EA] shadow-sm hover:scale-105 transition-transform">
                    <div className="w-10 h-10 rounded-full bg-[#FFD5EA]/30 flex items-center justify-center">
                      <Bot size={20} className="text-[#521845]" />
                    </div>
                    <span className="text-[10px] font-bold text-body">AI Chats (15m)</span>
                  </div>

                  <div className="h-6"></div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-1 z-10 relative">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-md">
                      <CheckCircle size={16} />
                    </div>
                    <span className="text-[10px] font-bold text-primary">Goal Reached!</span>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
