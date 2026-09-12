import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Bell, BookOpen, BrainCircuit, CalendarDays, CheckCircle2, Clock3, Flame, LockKeyhole, Target, Trophy, GitCompareArrows, Headphones, Plus, Trash2, Play, Pause, Square } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import * as pdfjsLib from 'pdfjs-dist';
import ProSettingsModal from '../components/ProSettingsModal';

const formatMinutes = value => `${Math.floor(value / 60)}h ${value % 60}m`;

export default function StudyTracker() {
  const { session, userProfile } = useAppContext();
  const [activities, setActivities] = useState([]);
  const [goal, setGoal] = useState(() => Number(localStorage.getItem('maxe_daily_goal')) || 120);
  const [reminder, setReminder] = useState(() => localStorage.getItem('maxe_study_reminder') || '22:00');
  const [loading, setLoading] = useState(true);
  const [showProModal, setShowProModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timerStatus, setTimerStatus] = useState('idle');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activityType, setActivityType] = useState('deep_work');

  useEffect(() => {
    let interval;
    if (timerStatus === 'running') {
      interval = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerStatus]);

  const toggleTimer = async () => {
    if (timerStatus === 'idle') {
      setTimerStatus('running');
    } else {
      setTimerStatus('idle');
      const durationMinutes = Math.floor(timerSeconds / 60);
      setTimerSeconds(0);
      
      if (durationMinutes >= 1) {
        setLoading(true);
        const { error } = await supabase.from('study_activity').insert([{
          user_id: session.user.id,
          activity_type: activityType,
          duration_minutes: durationMinutes
        }]);
        if (!error) {
           const { data } = await supabase.from('study_activity').select('activity_type, duration_minutes, created_at')
            .eq('user_id', session.user.id)
            .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
            .order('created_at', { ascending: true });
           setActivities(data || []);
        }
        setLoading(false);
      }
    }
  };
  const [roadmap, setRoadmap] = useState(() => JSON.parse(localStorage.getItem('maxe_roadmap') || '[]'));
  const [newSubject, setNewSubject] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [rivalUsername, setRivalUsername] = useState(() => localStorage.getItem('maxe_rival_username') || '');
  const [rival, setRival] = useState(null);
  const [rivalMinutes, setRivalMinutes] = useState(0);
  const [rivalStatus, setRivalStatus] = useState('');
  const [audioText, setAudioText] = useState('');
  const [audioState, setAudioState] = useState('idle');
  const [audioQueue, setAudioQueue] = useState([]);
  const [audioIndex, setAudioIndex] = useState(0);

  useEffect(() => {
    if (!session) return;
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

  useEffect(() => {
    if (!session) return;
    const checkStudyReminder = async () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const day = now.toISOString().slice(0, 10);
      if (currentTime !== reminder || localStorage.getItem(`maxe_study_reminder_sent_${session.user.id}_${day}`)) return;
      localStorage.setItem(`maxe_study_reminder_sent_${session.user.id}_${day}`, '1');
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Maxe study reminder', { body: `Your ${goal}-minute focus goal is waiting.` });
      }
      await supabase.from('notifications').insert([{
        user_id: session.user.id,
        content: `Study reminder: your ${goal}-minute focus goal is waiting.`,
        type: 'study',
        is_read: false
      }]);
    };
    const timer = window.setInterval(checkStudyReminder, 60000);
    return () => window.clearInterval(timer);
  }, [session, userProfile?.is_premium, reminder, goal]);

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

  const saveRoadmap = next => {
    setRoadmap(next);
    localStorage.setItem('maxe_roadmap', JSON.stringify(next));
  };

  const addRoadmapItem = e => {
    e.preventDefault();
    if (!newSubject.trim() || !newUnit.trim()) return;
    saveRoadmap([...roadmap, { id: crypto.randomUUID(), subject: newSubject.trim(), unit: newUnit.trim(), chapters: 0, completed: 0 }]);
    setNewUnit('');
  };

  const toggleChapter = id => saveRoadmap(roadmap.map(item => item.id === id ? { ...item, completed: item.completed < item.chapters ? item.completed + 1 : 0 } : item));
  const removeRoadmapItem = id => saveRoadmap(roadmap.filter(item => item.id !== id));

  const findRival = async e => {
    e.preventDefault();
    setRivalStatus('Searching...');
    const { data, error } = await supabase.from('profiles').select('id, name, username, avatar_url').eq('username', rivalUsername.trim().toLowerCase()).maybeSingle();
    if (error || !data) {
      setRival(null);
      setRivalStatus('No user found with that username.');
      return;
    }
    setRival(data);
    localStorage.setItem('maxe_rival_username', data.username);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: rivalData } = await supabase.from('study_activity').select('duration_minutes').eq('user_id', data.id).gte('created_at', weekAgo);
    setRivalMinutes((rivalData || []).reduce((sum, item) => sum + (Number(item.duration_minutes) || 0), 0));
    setRivalStatus('');
  };

  const speak = () => {
    if (!audioText.trim() || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const chunks = audioText.trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [audioText.trim()];
    setAudioQueue(chunks);
    setAudioIndex(0);
    speakChunk(chunks, 0);
    setAudioState('playing');
  };
  const speakChunk = (chunks, index) => {
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.rate = 0.95;
    utterance.onend = () => {
      if (index + 1 < chunks.length) {
        setAudioIndex(index + 1);
        speakChunk(chunks, index + 1);
      } else setAudioState('idle');
    };
    window.speechSynthesis.speak(utterance);
  };
  const pauseAudio = () => { window.speechSynthesis.pause(); setAudioState('paused'); };
  const resumeAudio = () => {
    if (!audioQueue.length) return;
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    else speakChunk(audioQueue, audioIndex);
    setAudioState('playing');
  };
  const stopAudio = () => { window.speechSynthesis.cancel(); setAudioQueue([]); setAudioIndex(0); setAudioState('idle'); };
  const handleAudioPdf = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer(), disableWorker: true }).promise;
      const pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map(item => item.str).join(' '));
      }
      setAudioText(pages.join('\n\n'));
    } catch (error) {
      console.error('Could not extract PDF text', error);
    } finally {
      event.target.value = '';
    }
  };

  

  return (
    <div className="space-y-6 pb-24 relative px-4 md:px-6 pt-6">
      {!userProfile?.is_premium && (
        <div 
          className="absolute inset-0 z-50 backdrop-blur-[3px] bg-[var(--theme-surface)]/20 rounded-2xl cursor-pointer"
          onClick={() => setShowProModal(true)}
        />
      )}
      {showProModal && <ProSettingsModal isOpen={showProModal} onClose={() => setShowProModal(false)} />}
      <div className={!userProfile?.is_premium ? "pointer-events-none select-none" : ""}>
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[.2em] font-bold text-primary">Maxe Pro</p>
          <h1 className="text-3xl font-black text-header mt-1">Study Lab</h1>
          <p className="text-sm text-body mt-1">A calm command centre for your semester.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><BarChart3 size={23} /></div>
      </header>

      <nav className="card p-2 flex gap-2 overflow-x-auto no-scrollbar mx-[-1rem] md:mx-0 px-4 md:px-2 rounded-none md:rounded-2xl border-x-0 md:border-x">
        {[
          ['overview', 'Overview', BarChart3],
          ['roadmap', 'Semester roadmap', Target],
          ['rival', 'Rival mode', GitCompareArrows],
          ['audio', 'Audiobook mode', Headphones]
        ].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex-1 min-w-max rounded-xl px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-2 ${activeTab === id ? 'bg-primary text-white' : 'text-body hover:bg-primary/5'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </nav>

      {activeTab === 'roadmap' && (
        <section className="space-y-5">
          <div className="card p-5"><h2 className="text-xl font-black text-header">Semester roadmap</h2><p className="text-sm text-body mt-1">Break each subject into units and mark chapters as you finish them.</p>
            <form onSubmit={addRoadmapItem} className="grid md:grid-cols-[1fr_1fr_auto] gap-2 mt-4">
              <input className="app-input" placeholder="Subject (e.g. Operating Systems)" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
              <input className="app-input" placeholder="Unit or chapter group" value={newUnit} onChange={e => setNewUnit(e.target.value)} />
              <button className="btn-primary flex items-center justify-center gap-1"><Plus size={15} /> Add</button>
            </form>
          </div>
          {roadmap.length === 0 ? <div className="card p-8 text-center text-sm text-body">Add your first subject to start building the semester map.</div> : <div className="grid md:grid-cols-2 gap-3">{roadmap.map(item => { const percent = item.chapters ? Math.round((item.completed / item.chapters) * 100) : 0; return <div className="card p-4" key={item.id}><div className="flex justify-between gap-2"><div><p className="font-black text-header">{item.subject}</p><p className="text-xs text-primary font-bold mt-1">{item.unit}</p></div><button onClick={() => removeRoadmapItem(item.id)} className="text-body hover:text-red-500"><Trash2 size={15} /></button></div><div className="flex items-center gap-2 mt-4"><input type="number" min="1" max="100" value={item.chapters || ''} placeholder="Chapters" onChange={e => saveRoadmap(roadmap.map(row => row.id === item.id ? { ...row, chapters: Math.max(0, Number(e.target.value)) } : row))} className="app-input py-1.5 w-24" /><button onClick={() => toggleChapter(item.id)} className="btn-outline flex-1 text-left">Mark next chapter complete</button></div><div className="h-2 rounded-full bg-primary/10 mt-4 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div><p className="text-xs text-body mt-2">{item.completed}/{item.chapters || 0} chapters · {percent}% complete</p></div>; })}</div>}
        </section>
      )}

      {activeTab === 'rival' && (
        <section className="card p-5 space-y-5"><div><h2 className="text-xl font-black text-header">Weekly Rival mode</h2><p className="text-sm text-body mt-1">Choose one friend and compare focus time for the current week. Nothing is public until you opt in.</p></div><form onSubmit={findRival} className="flex gap-2"><input className="app-input flex-1" placeholder="Friend's username" value={rivalUsername} onChange={e => setRivalUsername(e.target.value)} /><button className="btn-primary">Find rival</button></form>{rivalStatus && <p className="text-xs text-body">{rivalStatus}</p>}{rival && <div className="grid md:grid-cols-2 gap-3"><div className="rounded-2xl bg-primary/5 p-5 text-center"><p className="text-xs uppercase font-bold text-primary">You</p><p className="text-3xl font-black text-header mt-2">{formatMinutes(stats.total)}</p><p className="text-xs text-body">Last 90 days</p></div><div className="rounded-2xl bg-orange-500/5 p-5 text-center"><p className="text-xs uppercase font-bold text-orange-600">{rival.name || `@${rival.username}`}</p><p className="text-3xl font-black text-header mt-2">{formatMinutes(rivalMinutes)}</p><p className="text-xs text-body">This week</p></div></div>}</section>
      )}

      {activeTab === 'audio' && (
        <section className="card p-5 space-y-4"><div><h2 className="text-xl font-black text-header">Audiobook mode</h2><p className="text-sm text-body mt-1">Upload a PDF or paste notes and listen while commuting.</p></div><input type="file" accept="application/pdf" onChange={handleAudioPdf} className="app-input text-sm" /><textarea className="app-input min-h-48 resize-y" placeholder="Paste notes, PDF text, or copied AI chat here..." value={audioText} onChange={e => setAudioText(e.target.value)} /><div className="flex flex-wrap gap-2"><button onClick={speak} className="btn-primary flex items-center gap-2"><Play size={15} /> Read aloud</button>{audioState === 'playing' ? <button onClick={pauseAudio} className="btn-outline flex items-center gap-2"><Pause size={15} /> Pause</button> : audioState === 'paused' ? <button onClick={resumeAudio} className="btn-outline flex items-center gap-2"><Play size={15} /> Resume</button> : null}<button onClick={stopAudio} className="btn-outline flex items-center gap-2"><Square size={13} /> Stop</button></div><p className="text-xs text-body">PDF text is extracted locally in your browser.</p></section>
      )}

      {activeTab === 'overview' && <><section className="card p-5 grid md:grid-cols-[1fr_auto] gap-5 items-center overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-widest font-bold text-primary">Today’s focus</p>
          <div className="flex items-end gap-2 mt-2"><span className="text-5xl font-black text-header">{formatMinutes(stats.today)}</span><span className="text-sm text-body mb-2">/ {formatMinutes(goal)}</span></div>
          <div className="h-2 rounded-full bg-primary/10 mt-4 max-w-md overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (stats.today / goal) * 100)}%` }} /></div>
          <p className="text-xs text-body mt-2">{stats.today >= goal ? 'Daily goal complete. Protect the streak.' : `${formatMinutes(Math.max(0, goal - stats.today))} left to reach today’s goal.`}</p>
          <div className="flex gap-2 mt-5">
            <select 
              value={activityType} 
              onChange={e => setActivityType(e.target.value)} 
              disabled={timerStatus === 'running'}
              className="app-input w-32 text-xs font-bold bg-transparent border-primary/20"
            >
              <option value="deep_work">Deep Work</option>
              <option value="pdf">PDF Study</option>
              <option value="video">Video Lecture</option>
              <option value="ai_chat">AI Revision</option>
              <option value="quiz">Quiz Practice</option>
            </select>
            <button onClick={toggleTimer} className={`flex-1 py-3 font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${timerStatus === 'running' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' : 'btn-primary shadow-primary/20'}`}>
               {timerStatus === 'running' ? <Square size={16} /> : <Play size={16} />} 
               {timerStatus === 'running' ? `Stop & Save (${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, '0')})` : 'Start Focus Timer'}
            </button>
          </div>
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
      </section></>}

      {activeTab === 'overview' && <section className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        <div className="card p-5">
          <div className="flex justify-between items-center"><div><h2 className="font-black text-header">Consistency map</h2><p className="text-xs text-body mt-1">Your last 90 study days</p></div>{loading && <span className="text-xs text-primary">Syncing</span>}</div>
          <div className="grid gap-1 mt-5" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>{Array.from({ length: 90 }, (_, index) => { const day = new Date(); day.setDate(day.getDate() - (89 - index)); const value = stats.days[day.toISOString().slice(0, 10)] || 0; return <span key={index} className="aspect-square rounded-[3px]" title={`${day.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}: ${value} minutes`} style={{ background: value ? `color-mix(in srgb, var(--theme-primary) ${Math.min(90, 20 + value / 3)}%, var(--theme-bg))` : 'var(--theme-bg)' }} />; })}</div>
          <div className="flex gap-4 mt-4 text-xs text-body"><span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-primary" /> Active study day</span><span className="flex items-center gap-1"><Trophy size={13} className="text-orange-500" /> Keep your best streak alive</span></div>
        </div>
        <div className="card p-5 space-y-4">
          <div><h2 className="font-black text-header">Study settings</h2><p className="text-xs text-body mt-1">Make the system fit your college routine.</p></div>
          <label className="block"><span className="text-xs font-bold text-body">Daily focus goal (minutes)</span><input className="app-input mt-2" type="number" min="15" max="600" value={goal} onChange={e => saveGoal(e.target.value)} /></label>
          <label className="block"><span className="text-xs font-bold text-body flex items-center gap-1"><Bell size={13} /> Reminder time</span><input className="app-input mt-2" type="time" value={reminder} onChange={async e => { setReminder(e.target.value); localStorage.setItem('maxe_study_reminder', e.target.value); if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); }} /></label>
          <div className="rounded-xl bg-primary/5 p-3 text-xs text-body flex gap-2"><CalendarDays size={15} className="text-primary shrink-0" /> Use this goal for exam preparation, revision blocks, and weekly planning.</div>
        </div>
      </section>}
          </div>
    </div>
  );
}
