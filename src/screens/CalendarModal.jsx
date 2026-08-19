import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { X, Calendar as CalendarIcon, Plus, Bell } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function CalendarModal({ onClose }) {
  const { session } = useAppContext();
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [reminder, setReminder] = useState(7); // default 7 days

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true });
    if (data) setEvents(data);
  };

  const addEvent = async (e) => {
    e.preventDefault();
    if (!title || !date) return;

    // Convert local Date to YYYY-MM-DD
    const dateString = date.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('calendar_events')
      .insert([{ user_id: session.user.id, title, event_date: dateString, reminder_days: reminder }])
      .select();

    if (data) {
      setEvents([...events, data[0]].sort((a, b) => new Date(a.event_date) - new Date(b.event_date)));
      setTitle('');
    }
  };

  // Helper to add badges to calendar days
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      const dayEvents = events.filter(e => e.event_date === dateString);
      if (dayEvents.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-lg rounded-2xl border border-[#1e293b] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-2 text-header">
            <CalendarIcon size={20} className="text-primary" />
            <h2 className="text-lg font-bold">Exam Calendar</h2>
          </div>
          <button onClick={onClose} className="text-body hover:text-header transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-6 custom-calendar-wrapper">
          
          {/* React Calendar */}
          <div className="bg-[#080F1D] p-4 rounded-xl border border-[#1e293b] flex justify-center">
            <Calendar 
              onChange={setDate} 
              value={date} 
              tileContent={tileContent}
              className="!bg-transparent !border-none !text-header !font-sans"
            />
          </div>

          <form onSubmit={addEvent} className="bg-[#080F1D] p-4 rounded-xl border border-[#1e293b] space-y-3">
            <h3 className="text-sm font-semibold text-header">Add Event for {date.toDateString()}</h3>
            <input 
              type="text" 
              placeholder="Exam Name (e.g. Midterm 2 - Algo)" 
              value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-surface border border-[#1e293b] text-header rounded-lg p-2 text-sm"
              required
            />
            <div className="flex gap-2 items-center">
              <span className="text-xs text-body">Reminder:</span>
              <select 
                value={reminder} onChange={e => setReminder(Number(e.target.value))}
                className="flex-1 bg-surface border border-[#1e293b] text-header rounded-lg p-2 text-sm"
              >
                <option value={1}>1 Day before</option>
                <option value={3}>3 Days before</option>
                <option value={7}>1 Week before</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-primary/20 text-primary border border-primary/50 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/30">
              <Plus size={16} /> Add Event
            </button>
          </form>

          <div className="space-y-3 pb-4">
            <h3 className="text-sm font-semibold text-header border-b border-[#1e293b] pb-2">Upcoming Events</h3>
            {events.length === 0 && <p className="text-body text-xs">No upcoming exams.</p>}
            {events.map(ev => {
               const examDate = new Date(ev.event_date);
               const isSoon = (examDate - new Date()) / (1000 * 60 * 60 * 24) <= ev.reminder_days;

               return (
                 <div key={ev.id} className={`p-3 rounded-xl border ${isSoon ? 'bg-primary/10 border-primary/30' : 'bg-[#080F1D] border-[#1e293b]'} flex justify-between items-center`}>
                   <div>
                     <p className="text-header text-sm font-semibold">{ev.title}</p>
                     <p className="text-body text-xs mt-0.5">{examDate.toDateString()}</p>
                   </div>
                   {isSoon && (
                     <div className="flex items-center gap-1 text-primary text-[10px] font-bold bg-primary/20 px-2 py-1 rounded-full">
                       <Bell size={12} /> REMINDER
                     </div>
                   )}
                 </div>
               )
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
