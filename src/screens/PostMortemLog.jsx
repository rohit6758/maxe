import React from 'react';
import { CheckCircle2, AlertTriangle, UploadCloud, FileIcon, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PostMortemLog() {
  return (
    <div className="p-4 space-y-8 pb-24">
      
      {/* Header Section */}
      <div className="space-y-2 mt-2">
        <p className="text-body text-xs font-semibold tracking-widest uppercase flex items-center gap-2">
          <span className="w-4 h-4 border border-body rounded-full flex items-center justify-center text-[8px]">↻</span>
          MIDTERM 1: ADVANCED CALCULUS
        </p>
        <h2 className="text-3xl font-bold text-header text-aberration">Post-Mortem Log</h2>
        <p className="text-sm text-body leading-relaxed">
          Reviewing performance to recalibrate study strategies for the finals.
        </p>
      </div>

      {/* Component 1: Marks Received */}
      <div className="flex flex-col items-center">
        <p className="text-xs text-body font-semibold tracking-widest uppercase mb-4">Marks Received</p>
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="#252825" strokeWidth="6" strokeDasharray="4 2" />
            {/* Progress circle */}
            <circle 
              cx="50" cy="50" r="45" fill="none" stroke="#4F5D53" strokeWidth="6" 
              strokeDasharray="283" strokeDashoffset={283 * (1 - 18/20)} strokeLinecap="round" 
            />
          </svg>
          <div className="text-center">
            <span className="text-3xl font-bold text-primary">18</span>
            <div className="w-8 h-[1px] bg-[#333] mx-auto my-1"></div>
            <span className="text-sm text-body">20</span>
          </div>
        </div>
      </div>

      {/* Component 2: Professor's Tips */}
      <section>
        <div className="flex items-center gap-2 text-header font-semibold mb-4 text-lg">
          <CheckCircle2 className="text-body" size={20} />
          <h3>Professor's Tips</h3>
        </div>
        <div className="space-y-4">
          <TipItem text="Always state the theorem explicitly before applying it in the proof." />
          <Divider />
          <TipItem text="Define variables clearly at the start of word problems to avoid ambiguity." />
          <Divider />
          <TipItem text="Box the final answer; it makes grading faster and prevents careless misreads." />
        </div>
      </section>

      {/* Component 3: My Drawbacks */}
      <section>
        <div className="flex items-center gap-2 text-header font-semibold mb-4 text-lg">
          <AlertTriangle className="text-[#a85a5a]" size={20} />
          <h3>My Drawbacks</h3>
        </div>
        <div className="space-y-4">
          <DrawbackItem text="Missed diagram for Q4. Lost 2 marks purely on presentation." />
          <DrawbackItem text="Spent too much time on Section A. Rushed the final multi-part question." iconType="clock" />
          <DrawbackItem text="Silly arithmetic error in Q5 integration step. Need to double-check signs." iconType="calc" />
        </div>
      </section>

      {/* Component 4: Evidence & Scans */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-header font-semibold text-lg">
            <ImageIcon className="text-body" size={20} />
            <h3>Evidence & Scans</h3>
          </div>
          <span className="text-xs text-body">Edit Scan</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
           {/* Mock thumbnails */}
           <div className="aspect-square bg-[#1a1c1a] rounded-xl border border-[#333] relative overflow-hidden flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=200&h=200" alt="Notes 1" className="opacity-50 object-cover w-full h-full grayscale mix-blend-screen" />
           </div>
           <div className="aspect-square bg-[#1a1c1a] rounded-xl border border-[#333] relative overflow-hidden flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=200&h=200" alt="Notes 2" className="opacity-50 object-cover w-full h-full grayscale mix-blend-screen" />
           </div>
           
           {/* Upload Button linking to scan page */}
           <Link to="/scan" className="aspect-square rounded-xl border-2 border-dashed border-[#444] bg-surface/50 flex flex-col items-center justify-center gap-2 hover:bg-surface transition-colors">
              <UploadCloud size={24} className="text-body" />
              <span className="text-sm font-semibold text-primary">Upload</span>
           </Link>
        </div>
      </section>

      {/* Component 5: Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button className="flex-1 py-3 rounded-full border border-body text-body font-semibold text-sm hover:bg-surface transition-colors">
          Archive
        </button>
        <button className="flex-[2] py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          Save Reflection
        </button>
      </div>

    </div>
  );
}

// Subcomponents
const Divider = () => <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#333] to-transparent" />;

const TipItem = ({ text }) => (
  <div className="flex gap-3 items-start">
    <div className="mt-1 flex-shrink-0 text-body">
      <CheckCircle2 size={16} />
    </div>
    <p className="text-body text-sm leading-relaxed">{text}</p>
  </div>
);

const DrawbackItem = ({ text, iconType = "alert" }) => {
  const Icon = iconType === "clock" ? FileIcon : iconType === "calc" ? AlertTriangle : AlertTriangle; // using generic for now
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-1 flex-shrink-0 text-[#a85a5a] bg-[#3a2020] p-1 rounded-full border border-[#5c3030]">
        <Icon size={12} />
      </div>
      <p className="text-body text-sm leading-relaxed">{text}</p>
    </div>
  );
}
