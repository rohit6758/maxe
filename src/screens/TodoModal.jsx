import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Plus, CheckSquare2, Square, Trash2, X } from 'lucide-react';

export default function TodoModal({ onClose }) {
  const { session } = useAppContext();
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => { if (session) load(); }, [session]);

  const load = async () => {
    const { data } = await supabase.from('todos').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    setTodos(data || []);
  };

  const add = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const { data, error } = await supabase.from('todos').insert([{ user_id: session.user.id, text: text.trim(), completed: false }]).select();
    if (error) alert('Error adding task: ' + error.message);
    else if (data) { setTodos(p => [data[0], ...p]); setText(''); }
  };

  const toggle = async (todo) => {
    const { data, error } = await supabase.from('todos').update({ completed: !todo.completed }).eq('id', todo.id).select().single();
    if (error) alert('Error updating task: ' + error.message);
    else if (data) setTodos(p => p.map(t => t.id === todo.id ? data : t));
  };

  const del = async (id) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) alert('Error deleting task: ' + error.message);
    else setTodos(p => p.filter(t => t.id !== id));
  };

  const pending = todos.filter(t => !t.completed);
  const done = todos.filter(t => t.completed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:'rgba(45,74,62,0.25)', backdropFilter:'blur(6px)'}}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{background:'var(--theme-surface)', maxHeight:'90vh', border:'1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)'}}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 shrink-0" style={{background:'var(--theme-surface)', borderBottom:'1px solid color-mix(in srgb, var(--theme-primary) 15%, transparent)'}}>
          <div>
            <h2 className="font-bold text-lg" style={{color:'var(--theme-header)'}}>To-Do List</h2>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider mt-1">
              <span style={{color:'var(--theme-primary)'}}>{pending.length} pending</span>
              <span style={{color:'#A8C5B8'}}>{done.length} done</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-outline p-1.5 rounded-xl"><X size={16} /></button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          <form onSubmit={add} className="card p-3 flex gap-2">
            <input className="app-input flex-1 text-sm" placeholder="Add a task..." value={text} onChange={e => setText(e.target.value)} />
            <button type="submit" className="btn-primary px-3 py-1 flex items-center gap-1 text-xs rounded-xl">
              <Plus size={14} /> Add
            </button>
          </form>

          {pending.length > 0 && (
            <div className="card p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'var(--theme-primary)'}}>Pending</p>
              {pending.map(todo => (
                <div key={todo.id} className="card-sm flex items-center gap-3 p-2 group bg-surface">
                  <button onClick={() => toggle(todo)} style={{color:'#A8C5B8', flexShrink:0}}><Square size={16} /></button>
                  <p className="flex-1 text-sm" style={{color:'var(--theme-header)'}}>{todo.text}</p>
                  <button onClick={() => del(todo.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{color:'#E57373'}}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div className="card p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'#A8C5B8'}}>Completed</p>
              {done.map(todo => (
                <div key={todo.id} className="card-sm flex items-center gap-3 p-2 group bg-surface opacity-60">
                  <button onClick={() => toggle(todo)} style={{color:'var(--theme-primary)', flexShrink:0}}><CheckSquare2 size={16} /></button>
                  <p className="flex-1 text-sm line-through" style={{color:'var(--theme-body)'}}>{todo.text}</p>
                  <button onClick={() => del(todo.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{color:'#E57373'}}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {todos.length === 0 && (
            <div className="card p-8 text-center bg-surface">
              <p className="font-semibold text-sm" style={{color:'var(--theme-header)'}}>All clear!</p>
              <p className="text-xs mt-1" style={{color:'var(--theme-primary)'}}>Add your first task above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
