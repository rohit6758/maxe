import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { X, Plus, Bell } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function CalendarModal({ onClose }) {
  const { session } = useAppContext();
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', type: 'exam', marks: '' });

  useEffect(() => {
    if (session) fetchEvents();
  }, [session]);

  const fetchEvents = async () => {
    const { data } = await supabase.from('calendar_events').select('*').eq('user_id', session.user.id).order('event_date');
    setEvents(data || []);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('calendar_events').insert([{
      user_id: session.user.id,
      title: newEvent.title,
      type: newEvent.type,
      marks: newEvent.marks ? parseInt(newEvent.marks) : null,
      event_date: selectedDate.toISOString().split('T')[0]
    }]).select();
    if (data) {
      setEvents([...events, data[0]]);
      setNewEvent({ title: '', type: 'exam', marks: '' });
      setShowAddForm(false);
    }
  };

  const deleteEvent = async (id) => {
    await supabase.from('calendar_events').delete().eq('id', id);
    setEvents(events.filter(e => e.id !== id));
  };

  // Get events for the selected date
  const selectedStr = selectedDate.toISOString().split('T')[0];
  const dayEvents = events.filter(e => e.event_date === selectedStr);

  // Dates that have events (for dot markers)
  const eventDates = new Set(events.map(e => e.event_date));

  const tileContent = ({ date }) => {
    const str = date.toISOString().split('T')[0];
    if (eventDates.has(str)) {
      return (
        <div className="flex justify-center mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{background: '#38bdf8'}} />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: 'rgba(2,12,27,0.8)', backdropFilter: 'blur(8px)'}}>
      <div className="glass-strong rounded-2xl w-full max-w-lg shadow-2xl" style={{boxShadow: '0 0 60px rgba(56,189,248,0.15)'}}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cyan-400/10">
          <h2 className="text-header font-bold text-lg text-aberration">📅 Calendar</h2>
          <button onClick={onClose} className="glass-btn p-2 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Calendar */}
          <div className="glass-card rounded-2xl p-3">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
            />
          </div>

          {/* Selected Day */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-header font-bold text-sm">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button onClick={() => setShowAddForm(!showAddForm)} className="glass-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                <Plus size={12} /> ADD
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddEvent} className="space-y-3 border-t border-cyan-400/10 pt-3">
                <input
                  type="text" placeholder="Event title (e.g. Data Structures Mid 1)"
                  value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  className="glass-input w-full rounded-xl p-2.5 text-sm" required
                />
                <div className="flex gap-2">
                  <select
                    value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                    className="glass-input flex-1 rounded-xl p-2.5 text-sm cursor-pointer"
                  >
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="result">Result</option>
                    <option value="reminder">Reminder</option>
                  </select>
                  {(newEvent.type === 'exam' || newEvent.type === 'result') && (
                    <input
                      type="number" placeholder="Marks" min="0"
                      value={newEvent.marks} onChange={e => setNewEvent({...newEvent, marks: e.target.value})}
                      className="glass-input w-24 rounded-xl p-2.5 text-sm"
                    />
                  )}
                </div>
                <button type="submit" className="glass-btn-primary w-full py-2 rounded-xl text-xs font-bold">Save Event</button>
              </form>
            )}

            {dayEvents.length === 0 ? (
              <p className="text-body text-xs">No events on this day. Click + ADD to log an exam or reminder.</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-xl group" style={{background: 'rgba(56,189,248,0.08)'}}>
                    <span className="text-sm">
                      {ev.type === 'exam' ? '📝' : ev.type === 'result' ? '📊' : ev.type === 'assignment' ? '📌' : '🔔'}
                    </span>
                    <div className="flex-1">
                      <p className="text-header text-xs font-semibold">{ev.title}</p>
                      {ev.marks !== null && <p className="text-cyan-400 text-[10px]">Marks: {ev.marks}</p>}
                    </div>
                    <span className="text-[10px] text-body capitalize">{ev.type}</span>
                    <button onClick={() => deleteEvent(ev.id)} className="text-red-400/40 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          {events.length > 0 && (
            <div className="glass-card rounded-2xl p-4 space-y-2">
              <h3 className="text-header font-bold text-sm flex items-center gap-2"><Bell size={14} className="text-cyan-400" /> Upcoming</h3>
              {events
                .filter(e => e.event_date >= new Date().toISOString().split('T')[0])
                .slice(0, 5)
                .map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg" style={{background: 'rgba(56,189,248,0.05)'}}>
                    <span className="text-xs">{ev.type === 'exam' ? '📝' : ev.type === 'result' ? '📊' : ev.type === 'assignment' ? '📌' : '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-header text-xs font-medium truncate">{ev.title}</p>
                    </div>
                    <p className="text-body text-[10px] shrink-0">{new Date(ev.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
