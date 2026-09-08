import React, { useEffect, useMemo, useState } from 'react';
import { X, Flame, FileText, Bot, PlayCircle, CheckCircle, BarChart2, Calendar, Bell } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import VerifiedBadge from '../components/VerifiedBadge';
import { supabase } from '../lib/supabase';

export default function StudyTrackerModal({ isOpen, onClose }) {
  const { userProfile, session } = useAppContext();
  const [activities, setActivities] = useState([]);
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('maxe_study_reminder') || '22:00');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !session || !userProfile?.is_premium) return;
    let active = true;
    setIsLoading(true);
    supabase.from('study_activity')
      .select('activity_type, duration_minutes, created_at')
      .eq('user_id', session.user.id)
      .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST205') console.error('Failed to load study activity', error);
        if (active) setActivities(data || []);
      })
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [isOpen, session, userProfile?.is_premium]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const byDay = activities.reduce((map, item) => {
      const day = item.created_at.slice(0, 10);
      map[day] = (map[day] || 0) + (Number(item.duration_minutes) || 0);
      return map;
    }, {});
    let streak = 0;
    const cursor = new Date();
    while (byDay[cursor.toISOString().slice(0, 10)] > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    const total = activities.reduce((sum, item) => sum + (Number(item.duration_minutes) || 0), 0);
    return {
      today: byDay[today] || 0,
      streak,
      total,
      pdf: activities.filter(item => item.activity_type === 'pdf').reduce((sum, item) => sum + (Number(item.duration_minutes) || 0), 0),
      ai: activities.filter(item => item.activity_type === 'ai_chat').reduce((sum, item) => sum + (Number(item.duration_minutes) || 0), 0),
      days: byDay
    };
  }, [activities]);

  const saveReminder = (value) => {
    setReminderTime(value);
    localStorage.setItem('maxe_study_reminder', value);
  };

  const formatMinutes = (value) => `${Math.floor(value / 60)}h ${value % 60}m`;
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
            <div className="space-y-6 relative pb-4">
              
              {/* Streak Header */}
              <div className="flex items-center justify-center gap-3">
                <Flame size={40} className="text-[#FF9D00] drop-shadow-md animate-pulse" />
                <div>
                  <div className="text-4xl font-black text-header">{metrics.streak} <span className="text-xl text-body font-bold">Days</span></div>
                  <p className="text-xs font-bold text-[#FF9D00] uppercase tracking-wide">Current Streak</p>
                </div>
              </div>

              {/* Reminder */}
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Bell size={17} /></div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-header">Peak-focus reminder</p>
                  <p className="text-[11px] text-body">Keep your daily study window visible.</p>
                </div>
                <input type="time" value={reminderTime} onChange={e => saveReminder(e.target.value)} className="app-input !w-auto py-1.5 px-2 text-xs" />
              </div>

              {/* Weekly/Monthly Stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <BarChart2 size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-body uppercase">This Week</div>
                    <div className="text-sm font-black text-header">{formatMinutes(metrics.total)}</div>
                  </div>
                </div>
                <div className="bg-[#FF9D00]/5 border border-[#FF9D00]/10 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF9D00]/10 flex items-center justify-center text-[#FF9D00]">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-body uppercase">This Month</div>
                    <div className="text-sm font-black text-header">{formatMinutes(metrics.pdf + metrics.ai)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-primary/10 bg-surface p-3">
                      <p className="text-[10px] font-bold uppercase text-body">PDF focus</p>
                      <p className="text-lg font-black text-header">{formatMinutes(metrics.pdf)}</p>
                    </div>
                    <div className="rounded-xl border border-primary/10 bg-surface p-3">
                      <p className="text-[10px] font-bold uppercase text-body">AI tutor</p>
                      <p className="text-lg font-black text-header">{formatMinutes(metrics.ai)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/15 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-header">90-day consistency</h4>
                      {isLoading && <span className="text-[10px] text-primary">Syncing...</span>}
                    </div>
                    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
                      {Array.from({ length: 90 }, (_, index) => {
                        const day = new Date();
                        day.setDate(day.getDate() - (89 - index));
                        const value = metrics.days[day.toISOString().slice(0, 10)] || 0;
                        return <span key={index} title={`${value} minutes`} className="aspect-square rounded-[3px]" style={{ background: value ? `color-mix(in srgb, var(--theme-primary) ${Math.min(90, 20 + value / 3)}%, var(--theme-bg))` : 'var(--theme-bg)' }} />;
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flowchart Diagram - Today's Analysis */}
              <div className="mt-6 border border-primary/20 rounded-2xl p-6 bg-background/30 relative">
                <h4 className="text-xs font-bold text-header uppercase tracking-widest text-center mb-6">Today's Analysis</h4>
                
                <div className="flex flex-col items-center gap-2 relative">
                  
                  {/* Vertical Line */}
                  <div className="absolute top-8 bottom-8 left-1/2 w-0.5 bg-primary/20 -translate-x-1/2"></div>
                  
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-1 z-10 relative bg-surface p-2 rounded-full border-2 border-primary shadow-sm hover:scale-105 transition-transform w-32">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText size={20} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-header text-center">PDFs Used</span>
                    <span className="text-[10px] font-black text-primary text-center">2 hrs 00 min</span>
                  </div>
                  
                  <div className="h-6"></div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-1 z-10 relative bg-surface p-2 rounded-full border-2 border-[#FFD5EA] shadow-sm hover:scale-105 transition-transform w-32">
                    <div className="w-10 h-10 rounded-full bg-[#FFD5EA]/30 flex items-center justify-center">
                      <Bot size={20} className="text-[#521845]" />
                    </div>
                    <span className="text-[10px] font-bold text-header text-center">AI Chat</span>
                    <span className="text-[10px] font-black text-[#521845] text-center">10 min</span>
                  </div>

                  <div className="h-6"></div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-1 z-10 relative bg-surface p-2 rounded-full border-2 border-[#84B3CE] shadow-sm hover:scale-105 transition-transform w-32">
                    <div className="w-10 h-10 rounded-full bg-[#84B3CE]/10 flex items-center justify-center">
                      <PlayCircle size={20} className="text-[#84B3CE]" />
                    </div>
                    <span className="text-[10px] font-bold text-header text-center">Video Lessons</span>
                    <span className="text-[10px] font-black text-[#84B3CE] text-center">45 min</span>
                  </div>

                  <div className="h-6"></div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-1 z-10 relative">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-md">
                      <CheckCircle size={16} />
                    </div>
                    <span className="text-[10px] font-bold text-primary">Daily Goal Reached!</span>
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
