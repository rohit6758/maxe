import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { CheckSquare, Plus, Trash2 } from 'lucide-react';

export default function Todos() {
  const { session } = useAppContext();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const { data } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTodos(data);
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    const { data, error } = await supabase
      .from('todos')
      .insert([{ user_id: session.user.id, text: newTodo }])
      .select();
      
    if (data) {
      setTodos([data[0], ...todos]);
      setNewTodo('');
    }
  };

  const toggleTodo = async (id, completed) => {
    await supabase.from('todos').update({ completed: !completed }).eq('id', id);
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !completed } : t));
  };

  const deleteTodo = async (id) => {
    await supabase.from('todos').delete().eq('id', id);
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="p-4 space-y-6 md:p-8 pb-24 md:pb-8">
      <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
        <CheckSquare className="text-primary w-8 h-8" />
        <h2 className="text-2xl font-bold text-header">To-Do List</h2>
      </div>

      <form onSubmit={addTodo} className="flex gap-2">
        <input 
          type="text" 
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-surface border border-[#1e293b] text-header rounded-xl p-3 focus:outline-none focus:border-primary"
        />
        <button type="submit" className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90">
          <Plus size={24} />
        </button>
      </form>

      <div className="space-y-3">
        {todos.length === 0 && <p className="text-body text-center mt-8">No tasks yet. Add one above!</p>}
        {todos.map(todo => (
          <div key={todo.id} className="flex items-center justify-between bg-surface p-4 rounded-xl border border-[#1e293b]">
            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleTodo(todo.id, todo.completed)}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${todo.completed ? 'bg-primary border-primary' : 'border-body bg-transparent'}`}>
                {todo.completed && <CheckSquare size={14} className="text-white" />}
              </div>
              <span className={`text-sm ${todo.completed ? 'text-body line-through' : 'text-header'}`}>
                {todo.text}
              </span>
            </div>
            <button onClick={() => deleteTodo(todo.id)} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors ml-2">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
