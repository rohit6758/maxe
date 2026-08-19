import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Check, Play, Flag, AlertTriangle, Edit2 } from 'lucide-react';

export default function ExamProgression() {
  const { session, activeSubject } = useAppContext();
  const [todos, setTodos] = useState([]);
  
  // We can fetch active subject's post-mortem for Node 1
  // We can fetch todos for Node 2

  useEffect(() => {
    if (session) {
      fetchTodos();
    }
  }, [session]);

  const fetchTodos = async () => {
    const { data } = await supabase.from('todos').select('*').limit(4);
    if (data) setTodos(data);
  };

  const completedTodos = todos.filter(t => t.completed).length;
  const progressPercent = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 md:pb-8 relative">
      
      {/* Header Section */}
      <div className="space-y-2 mt-2">
        <h2 className="text-3xl font-bold text-header text-aberration">Exam Timeline</h2>
        <p className="text-sm text-body leading-relaxed">
          Track your academic progress, manage current preparation phases, and target future milestones.
        </p>
      </div>

      {/* Timeline Section */}
      <div className="relative pl-6 mt-8 space-y-8">
        {/* Continuous Line */}
        <div className="absolute top-4 bottom-8 left-[11px] w-[2px] bg-gradient-to-b from-primary via-primary/50 to-[#1e293b]" />

        {/* Node 1: Completed */}
        <div className="relative">
          <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-4 ring-background z-10">
            <Check size={14} className="text-white" />
          </div>
          
          <div className="bg-surface rounded-xl p-5 border border-[#1e293b]">
            <div className="flex justify-between items-start mb-4">
               <div>
                 <span className="text-[10px] font-bold tracking-widest uppercase text-body mb-1 block flex items-center gap-1">
                   <span className="w-1 h-1 bg-primary rounded-full"></span> COMPLETED
                 </span>
                 <h3 className="text-header font-bold text-lg">Mid 1 Exam</h3>
               </div>
            </div>
            
            <p className="text-sm text-body leading-relaxed mb-4">
              Foundational concepts and primary modules.
            </p>
            
            <div className="text-xs text-body border-t border-[#1e293b] pt-3">
              Finished on Oct 15, 2023
            </div>
          </div>
        </div>

        {/* Node 2: Active */}
        <div className="relative">
          <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-surface border-2 border-primary flex items-center justify-center ring-4 ring-background z-10">
            <Play size={10} className="text-primary fill-primary" />
          </div>
          
          <div className="bg-surface border border-primary/30 rounded-xl p-5 shadow-[0_0_20px_rgba(79,134,247,0.15)]">
            <div className="flex justify-between items-start mb-2">
               <div>
                 <span className="text-[10px] font-bold tracking-widest uppercase text-primary mb-1 block flex items-center gap-1">
                   <Play size={8} className="fill-primary" /> IN PROGRESS
                 </span>
                 <h3 className="text-header font-bold text-lg">Current Prep Phase</h3>
               </div>
            </div>
            <p className="text-sm text-body mb-4">Deep dive into advanced algorithms and data structures.</p>
            
            <div className="mb-4 bg-[#080F1D] p-3 rounded-lg border border-[#1e293b]">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-body">Phase Completion</span>
                <span className="text-primary">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#1e293b] rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            
            <div className="space-y-3 mt-4">
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-body mb-2">KEY TASKS (From To-Do)</h4>
              {todos.length === 0 && <p className="text-xs text-body">No tasks in your To-Do list.</p>}
              {todos.map(todo => (
                <CheckboxItem key={todo.id} label={todo.text} checked={todo.completed} />
              ))}
            </div>
          </div>
        </div>

        {/* Node 3: Planned */}
        <div className="relative">
          <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-surface border-2 border-[#1e293b] flex items-center justify-center ring-4 ring-background z-10">
            <Flag size={12} className="text-body" />
          </div>
          
          <div className="bg-transparent border border-[#1e293b] rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
               <div>
                 <span className="text-[10px] font-bold tracking-widest uppercase text-body mb-1 block">UPCOMING TARGET</span>
                 <h3 className="text-header font-bold text-lg opacity-80">Mid 2 Exam Target</h3>
               </div>
            </div>
            <p className="text-sm text-body leading-relaxed mb-3">
              Comprehensive review and final assessments.
            </p>
            <div className="text-xs text-body border-t border-[#1e293b] pt-3 flex items-center gap-2">
              <Calendar size={14} className="text-primary" /> Scheduled for Dec 05, 2023
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// Subcomponent
const CheckboxItem = ({ label, checked }) => (
  <label className="flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-[#080F1D]">
    <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${checked ? 'bg-primary border-primary' : 'border border-[#475569] bg-[#080F1D]'}`}>
      {checked && <Check size={12} className="text-white" strokeWidth={3} />}
    </div>
    <span className={`text-sm ${checked ? 'text-body line-through opacity-60' : 'text-header font-medium'}`}>
      {label}
    </span>
  </label>
);
