import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Bell, BookOpen, BrainCircuit, CalendarDays, CheckCircle2, Clock3, Flame, LockKeyhole, Target, Trophy } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const formatMinutes = value => `${Math.floor(value / 60)}h ${value % 60}m`;

export default function StudyTracker() {
  const { session, userProfile } = useAppContext();
  const [activities, setActivities] = useState([]);
  const [goal, setGoal] = useState(() => Number(localStorage.getItem('maxe_daily_goal')) || 120);
  const [reminder, setReminder] = useState(() => localStorage.getItem('maxe_study_reminder') || '22:00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !userProfile?.is_premium) return;
    let mounted = true;
    supabase.from('study_activity').select('activity_type, duration_minutes, created_at')
      .eq('user_id', session.user.id)
      .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST205') console.error('Study tracker data unavailable', error);
        if (mounted) setActivities(data || []);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [session, userProfile?.is_premium]);

  const stats = useMemo(() => {
    const days = {};
    const totals = { pdf: 0, ai_chat: 0, video: 0, quiz: 0 };
    activities.forEach(item => {
      const minutes = Number(item.duration_minutes) || 0;
      const day = item.created_at.slice(0, 10);
      days[day] = (days[day] || 0) + minutes;
      totals[item.activity_type] = (totals[item.activity_type] || 0) + minutes;
    });
    let streak = 0;
    const cursor = new Date();
    while (days[cursor.toISOString().slice(0, 10)] > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    const today = new Date().toISOString().slice(0, 10);
    return { days, totals, today: days[today] || 0, total: Object.values(totals).reduce((a, b) => a + b, 0), streak };
  }, [activities]);

  const saveGoal = value => {
    const next = Math.max(15, Math.min(600, Number(value) || 120));
    setGoal(next);
    localStorage.setItem('maxe_daily_goal', next);
  };

  if (!userProfile?.is_premium) {
    return (
      <div className="card max-w-xl mx-auto p-8 text-center">
        <LockKeyhole size={38} className="mx-auto text-primary mb-4" />
        <h1 className="text-2xl font-black text-header">Maxe Study Lab</h1>
        <p className="text-sm text-body mt-2">A focused study dashboard for Pro students. Track PDFs, AI revision, quizzes, streaks, and goals in one place.</p>
        <button className="btn-primary mt-6">Upgrade to unlock</button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[.2em] font-bold text-primary">Maxe Pro</p>
          <h1 className="text-3xl font-black text-header mt-1">Study Lab</h1>
          <p className="text-sm text-body mt-1">A calm command centre for your semester.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><BarChart3 size={23} /></div>
      </header>

      <section className="card p-5 grid md:grid-cols-[1fr_auto] gap-5 items-center overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-widest font-bold text-primary">Today’s focus</p>
          <div className="flex items-end gap-2 mt-2"><span className="text-5xl font-black text-header">{formatMinutes(stats.today)}</span><span className="text-sm text-body mb-2">/ {formatMinutes(goal)}</span></div>
          <div className="h-2 rounded-full bg-primary/10 mt-4 max-w-md overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (stats.today / goal) * 100)}%` }} /></div>
          <p className="text-xs text-body mt-2">{stats.today >= goal ? 'Daily goal complete. Protect the streak.' : `${formatMinutes(Math.max(0, goal - stats.today))} left to reach today’s goal.`}</p>
        </div>
        <div className="w-28 h-28 rounded-full border-[10px] border-primary/10 flex items-center justify-center relative" style={{ borderTopColor: 'var(--theme-primary)', transform: `rotate(${Math.min(360, (stats.today / goal) * 360)}deg)` }}><Target size={28} className="text-primary" style={{ transform: `rotate(-${Math.min(360, (stats.today / goal) * 360)}deg)` }} /></div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          [Flame, 'Current streak', `${stats.streak} days`, 'text-orange-500'],
          [Clock3, 'Total focus', formatMinutes(stats.total), 'text-primary'],
          [BookOpen, 'PDF study', formatMinutes(stats.totals.pdf), 'text-sky-600'],
          [BrainCircuit, 'AI revision', formatMinutes(stats.totals.ai_chat), 'text-violet-600']
        ].map(([Icon, label, value, color]) => <div className="card p-4" key={label}><Icon size={18} className={color} /><p className="text-[10px] uppercase tracking-wider font-bold text-body mt-3">{label}</p><p className="text-lg font-black text-header mt-1">{value}</p></div>)}
      </section>

      <section className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        <div className="card p-5">
          <div className="flex justify-between items-center"><div><h2 className="font-black text-header">Consistency map</h2><p className="text-xs text-body mt-1">Your last 90 study days</p></div>{loading && <span className="text-xs text-primary">Syncing</span>}</div>
          <div className="grid gap-1 mt-5" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>{Array.from({ length: 90 }, (_, index) => { const day = new Date(); day.setDate(day.getDate() - (89 - index)); const value = stats.days[day.toISOString().slice(0, 10)] || 0; return <span key={index} className="aspect-square rounded-[3px]" title={`${value} minutes`} style={{ background: value ? `color-mix(in srgb, var(--theme-primary) ${Math.min(90, 20 + value / 3)}%, var(--theme-bg))` : 'var(--theme-bg)' }} />; })}</div>
          <div className="flex gap-4 mt-4 text-xs text-body"><span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-primary" /> Active study day</span><span className="flex items-center gap-1"><Trophy size={13} className="text-orange-500" /> Keep your best streak alive</span></div>
        </div>
        <div className="card p-5 space-y-4">
          <div><h2 className="font-black text-header">Study settings</h2><p className="text-xs text-body mt-1">Make the system fit your college routine.</p></div>
          <label className="block"><span className="text-xs font-bold text-body">Daily focus goal (minutes)</span><input className="app-input mt-2" type="number" min="15" max="600" value={goal} onChange={e => saveGoal(e.target.value)} /></label>
          <label className="block"><span className="text-xs font-bold text-body flex items-center gap-1"><Bell size={13} /> Reminder time</span><input className="app-input mt-2" type="time" value={reminder} onChange={e => { setReminder(e.target.value); localStorage.setItem('maxe_study_reminder', e.target.value); }} /></label>
          <div className="rounded-xl bg-primary/5 p-3 text-xs text-body flex gap-2"><CalendarDays size={15} className="text-primary shrink-0" /> Use this goal for exam preparation, revision blocks, and weekly planning.</div>
        </div>
      </section>
    </div>
  );
}
