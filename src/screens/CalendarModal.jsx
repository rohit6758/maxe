import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { X, Plus, Bell } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function CalendarModal({ onClose }) {
  const { session } = useAppContext();
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'exam', marks: '' });

  useEffect(() => { if (session) load(); }, [session]);

  const load = async () => {
    const { data } = await supabase.from('calendar_events').select('*').eq('user_id', session.user.id).order('event_date');
    setEvents(data || []);
  };

  const save = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('calendar_events').insert([{
      user_id: session.user.id,
      title: form.title,
      type: form.type,
      marks: form.marks ? parseInt(form.marks) : null,
      event_date: selected.toISOString().split('T')[0]
    }]).select();
    if (error) {
      alert('Failed to save event: ' + error.message);
    } else if (data) {
      setEvents(p => [...p, data[0]]);
      setForm({ title: '', type: 'exam', marks: '' });
      setShowForm(false);
    }
  };

  const del = async (id) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) alert('Failed to delete event: ' + error.message);
    else setEvents(p => p.filter(e => e.id !== id));
  };

  const selStr = selected.toISOString().split('T')[0];
  const dayEvents = events.filter(e => e.event_date === selStr);
  const eventDates = new Set(events.map(e => e.event_date));
  const typeIcon = { exam:'📝', assignment:'📌', result:'📊', reminder:'🔔' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:'rgba(42, 42, 42,0.25)', backdropFilter:'blur(6px)'}}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{background:'var(--color-surface)', maxHeight:'90vh', overflowY:'auto', border:'1px solid rgba(79, 93, 83,0.2)'}}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 sticky top-0" style={{background:'var(--color-surface)', borderBottom:'1px solid rgba(79, 93, 83,0.15)'}}>
          <h2 className="font-bold text-lg" style={{color:'var(--color-header)'}}>📅 Calendar</h2>
          <button onClick={onClose} className="btn-outline p-1.5 rounded-xl"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Calendar widget */}
          <div className="card p-3">
            <Calendar
              onChange={setSelected}
              value={selected}
              tileContent={({ date }) => {
                const s = date.toISOString().split('T')[0];
                return eventDates.has(s)
                  ? <div className="flex justify-center mt-0.5"><div className="w-1.5 h-1.5 rounded-full" style={{background:'var(--color-primary)'}} /></div>
                  : null;
              }}
            />
          </div>

          {/* Day events */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm" style={{color:'var(--color-header)'}}>
                {selected.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <button onClick={() => setShowForm(!showForm)} className="btn-outline text-xs flex items-center gap-1 py-1 px-2">
                <Plus size={11} /> Add
              </button>
            </div>

            {showForm && (
              <form onSubmit={save} className="space-y-2 pt-2 border-t" style={{borderColor:'rgba(79, 93, 83,0.15)'}}>
                <input className="app-input" placeholder="Event title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                <div className="flex gap-2">
                  <select className="app-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="result">Result</option>
                    <option value="reminder">Reminder</option>
                  </select>
                  {(form.type === 'exam' || form.type === 'result') && (
                    <input type="number" className="app-input w-24" placeholder="Marks" value={form.marks} onChange={e => setForm({...form, marks: e.target.value})} />
                  )}
                </div>
                <button type="submit" className="btn-primary w-full py-2 text-xs rounded-xl">Save Event</button>
              </form>
            )}

            {dayEvents.length === 0
              ? <p className="text-sm" style={{color:'var(--color-accent)'}}>No events. Tap + Add to log an exam or reminder.</p>
              : dayEvents.map(ev => (
                <div key={ev.id} className="flex items-center gap-2 p-2 rounded-xl group" style={{background:'rgba(79, 93, 83,0.08)'}}>
                  <span>{typeIcon[ev.type] || '📌'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{color:'var(--color-header)'}}>{ev.title}</p>
                    {ev.marks !== null && <p className="text-xs" style={{color:'var(--color-primary)'}}>Marks: {ev.marks}</p>}
                  </div>
                  <button onClick={() => del(ev.id)} className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{color:'#E57373'}}>✕</button>
                </div>
              ))
            }
          </div>

          {/* Upcoming */}
          {events.filter(e => e.event_date >= new Date().toISOString().split('T')[0]).length > 0 && (
            <div className="card p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{color:'var(--color-primary)'}}>
                <Bell size={12} /> Upcoming
              </p>
              {events
                .filter(e => e.event_date >= new Date().toISOString().split('T')[0])
                .slice(0, 5)
                .map(ev => (
                  <div key={ev.id} className="flex items-center gap-2 p-2 rounded-lg" style={{background:'rgba(79, 93, 83,0.06)'}}>
                    <span className="text-sm">{typeIcon[ev.type] || '📌'}</span>
                    <p className="flex-1 text-xs font-medium truncate" style={{color:'var(--color-header)'}}>{ev.title}</p>
                    <p className="text-[10px] shrink-0" style={{color:'var(--color-accent)'}}>
                      {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
