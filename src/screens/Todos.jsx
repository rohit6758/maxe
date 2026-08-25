import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Plus, CheckSquare2, Square, Trash2 } from 'lucide-react';

export default function Todos() {
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
    <div className="space-y-4 pb-24 md:pb-8">
      <div className="card p-4">
        <h2 className="text-xl font-bold text-aberration" style={{color:'#2D4A3E'}}>To-Do List</h2>
        <div className="flex gap-4 mt-1 text-xs font-semibold">
          <span style={{color:'#6BA898'}}>{pending.length} pending</span>
          <span style={{color:'#A8C5B8'}}>{done.length} done</span>
        </div>
      </div>

      <form onSubmit={add} className="card p-3 flex gap-2">
        <input className="app-input flex-1" placeholder="Add a task..." value={text} onChange={e => setText(e.target.value)} />
        <button type="submit" className="btn-primary px-4 py-2 flex items-center gap-1 text-sm whitespace-nowrap rounded-xl">
          <Plus size={15} /> Add
        </button>
      </form>

      {pending.length > 0 && (
        <div className="card p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#6BA898'}}>Pending</p>
          {pending.map(todo => (
            <div key={todo.id} className="card-sm flex items-center gap-3 p-3 group">
              <button onClick={() => toggle(todo)} style={{color:'#A8C5B8', flexShrink:0}}><Square size={18} /></button>
              <p className="flex-1 text-sm" style={{color:'#2D4A3E'}}>{todo.text}</p>
              <button onClick={() => del(todo.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{color:'#E57373'}}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="card p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#A8C5B8'}}>Completed</p>
          {done.map(todo => (
            <div key={todo.id} className="card-sm flex items-center gap-3 p-3 group opacity-60">
              <button onClick={() => toggle(todo)} style={{color:'#6BA898', flexShrink:0}}><CheckSquare2 size={18} /></button>
              <p className="flex-1 text-sm line-through" style={{color:'#5E7A6E'}}>{todo.text}</p>
              <button onClick={() => del(todo.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{color:'#E57373'}}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {todos.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="font-semibold" style={{color:'#2D4A3E'}}>All clear!</p>
          <p className="text-sm mt-1" style={{color:'#6BA898'}}>Add your first study task above.</p>
        </div>
      )}
    </div>
  );
}
