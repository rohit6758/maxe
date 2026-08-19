import React from 'react';
import { Check, Play, Flag, AlertTriangle, Edit2 } from 'lucide-react';

export default function ExamProgression() {
  return (
    <div className="p-4 space-y-6 pb-24 relative">
      
      {/* Header Section */}
      <div className="space-y-2 mt-2">
        <h2 className="text-3xl font-bold text-header text-aberration">Exam Progression</h2>
        <p className="text-sm text-body leading-relaxed">
          Your strategic path from Mid 1 to Mid 2. Review mistakes, track current focus, and aim for the target.
        </p>
      </div>

      {/* Timeline Section */}
      <div className="relative pl-6 mt-8 space-y-8">
        {/* Continuous Line */}
        <div className="absolute top-4 bottom-8 left-[11px] w-[2px] bg-gradient-to-b from-primary via-primary/50 to-[#333]" />

        {/* Node 1: Completed */}
        <div className="relative">
          <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-4 ring-background z-10">
            <Check size={14} className="text-white" />
          </div>
          
          <div className="bg-surface rounded-xl p-4 border border-[#333]">
            <div className="flex justify-between items-start mb-4">
               <h3 className="text-header font-bold text-lg">Mid 1 Exam</h3>
               <span className="text-[10px] font-semibold bg-[#2a2a2a] text-body px-2 py-1 rounded">Completed</span>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-body flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-body rounded-full"></span> POST-MORTEM SUMMARY
              </p>
              <p className="text-sm text-body leading-relaxed">
                Overall performance was solid, but time management in the final section severely impacted the score. The following drawbacks need immediate correction.
              </p>
              
              <div className="bg-[#1e211e] border border-[#333] rounded-lg p-3 flex gap-3 items-start">
                <AlertTriangle size={16} className="text-[#a85a5a] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-header text-sm font-semibold">Time Allocation</h4>
                  <p className="text-xs text-body mt-1 leading-relaxed">Spent too long on Section A. Start Section C earlier next time.</p>
                </div>
              </div>
              
              <div className="bg-[#1e211e] border border-[#333] rounded-lg p-3 flex gap-3 items-start">
                <Edit2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-header text-sm font-semibold">Missing Visuals</h4>
                  <p className="text-xs text-body mt-1 leading-relaxed">Lost points for omitting required flowcharts in long-form answers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Node 2: Active */}
        <div className="relative">
          <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-surface border-2 border-primary flex items-center justify-center ring-4 ring-background z-10">
            <Play size={10} className="text-primary fill-primary" />
          </div>
          
          <div className="bg-surface border border-primary/30 rounded-xl p-4 shadow-[0_0_15px_rgba(79,93,83,0.1)]">
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-header font-bold text-lg">Current Prep Phase</h3>
               <span className="text-[10px] font-semibold bg-primary/20 text-primary px-2 py-1 rounded">Active</span>
            </div>
            <p className="text-sm text-body mb-4">Deep dive into Unit 3 & 4</p>
            
            <div className="mb-4">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-body">Phase Completion</span>
                <span className="text-header">45%</span>
              </div>
              <div className="w-full bg-[#181A18] rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            
            <div className="space-y-3 mt-4">
              <CheckboxItem label="Review Mid 1 notes and identify weak spots" checked />
              <CheckboxItem label="Complete Unit 3 practice questions" checked />
              <CheckboxItem label="Draft flowcharts for Unit 4 core concepts" active />
              <CheckboxItem label="Take timed mock exam for Section C" />
            </div>
          </div>
        </div>

        {/* Node 3: Planned */}
        <div className="relative">
          <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-surface border-2 border-[#444] flex items-center justify-center ring-4 ring-background z-10">
            <Flag size={12} className="text-[#444]" />
          </div>
          
          <div className="bg-transparent border border-[#333] rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
               <h3 className="text-header font-bold text-lg opacity-80">Mid 2 Exam Target</h3>
               <div className="flex items-center gap-1 bg-[#1e211e] border border-[#333] px-2 py-1 rounded-full">
                 <span className="w-1.5 h-1.5 bg-body rounded-full"></span>
                 <span className="text-[10px] font-bold tracking-wider text-body">12 DAYS LEFT</span>
               </div>
            </div>
            <p className="text-sm text-body leading-relaxed">
              Goal: Improve overall score by 15% focusing on clear structure and comprehensive diagram inclusion.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

// Subcomponent
const CheckboxItem = ({ label, checked, active }) => (
  <label className={`flex items-start gap-3 cursor-pointer p-2 rounded-lg transition-colors ${active ? 'bg-[#1e211e] border border-primary/20' : 'hover:bg-[#1e211e]'}`}>
    <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${checked ? 'bg-body' : 'border border-[#555] bg-[#181A18]'}`}>
      {checked && <Check size={12} className="text-[#181A18]" strokeWidth={3} />}
    </div>
    <span className={`text-sm ${checked ? 'text-[#666] line-through' : active ? 'text-header font-medium' : 'text-body'}`}>
      {label}
    </span>
  </label>
);
