import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Plus, Trash2, CheckSquare2, Square } from 'lucide-react';

export default function Todos() {
  const { session } = useAppContext();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    if (session) fetchTodos();
  }, [session]);

  const fetchTodos = async () => {
    const { data } = await supabase.from('todos').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    setTodos(data || []);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    const { data } = await supabase.from('todos').insert([{ user_id: session.user.id, text: newTodo.trim(), done: false }]).select();
    if (data) { setTodos([data[0], ...todos]); setNewTodo(''); }
  };

  const toggleDone = async (todo) => {
    const { data } = await supabase.from('todos').update({ done: !todo.done }).eq('id', todo.id).select().single();
    if (data) setTodos(todos.map(t => t.id === todo.id ? data : t));
  };

  const deleteTodo = async (id) => {
    await supabase.from('todos').delete().eq('id', id);
    setTodos(todos.filter(t => t.id !== id));
  };

  const pending = todos.filter(t => !t.done);
  const done = todos.filter(t => t.done);

  return (
    <div className="p-4 md:p-6 space-y-5 pb-24 md:pb-8">
      
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-2xl font-bold text-header text-aberration flex items-center gap-2">
          ✅ To-Do List
        </h2>
        <p className="text-body text-sm mt-1">Track your study tasks and assignments</p>
        <div className="flex gap-4 mt-3 text-xs">
          <span className="text-cyan-400 font-bold">{pending.length} pending</span>
          <span className="text-body">{done.length} completed</span>
        </div>
      </div>

      {/* Add Todo */}
      <form onSubmit={handleAdd} className="glass rounded-2xl p-4 flex gap-3">
        <input
          type="text"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className="glass-input flex-1 rounded-xl p-3 text-sm"
        />
        <button type="submit" className="glass-btn-primary px-4 rounded-xl font-bold flex items-center gap-1">
          <Plus size={16} />
        </button>
      </form>

      {/* Pending Tasks */}
      {pending.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-2">
          <p className="text-xs text-body uppercase tracking-widest font-bold mb-3">Pending</p>
          {pending.map(todo => (
            <div key={todo.id} className="glass-card rounded-xl p-3 flex items-center gap-3 group">
              <button onClick={() => toggleDone(todo)} className="text-body hover:text-cyan-400 transition-colors shrink-0">
                <Square size={18} />
              </button>
              <p className="text-header text-sm flex-1 leading-relaxed">{todo.text}</p>
              <button onClick={() => deleteTodo(todo.id)} className="text-red-400/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {done.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-2">
          <p className="text-xs text-body uppercase tracking-widest font-bold mb-3">Completed</p>
          {done.map(todo => (
            <div key={todo.id} className="glass-card rounded-xl p-3 flex items-center gap-3 group opacity-60">
              <button onClick={() => toggleDone(todo)} className="text-cyan-400 shrink-0">
                <CheckSquare2 size={18} />
              </button>
              <p className="text-body text-sm flex-1 leading-relaxed line-through">{todo.text}</p>
              <button onClick={() => deleteTodo(todo.id)} className="text-red-400/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {todos.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-header font-semibold">No tasks yet</p>
          <p className="text-body text-sm mt-1">Add your first study task above!</p>
        </div>
      )}
    </div>
  );
}
