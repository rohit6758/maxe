import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, UploadCloud, Image as ImageIcon } from 'lucide-react';

export default function PostMortemLog() {
  const { session, activeSubject } = useAppContext();
  
  const [log, setLog] = useState(null);
  const [items, setItems] = useState([]);
  const [evidence, setEvidence] = useState([]);

  useEffect(() => {
    if (activeSubject) {
      fetchLog();
    } else {
      setLog(null);
      setItems([]);
      setEvidence([]);
    }
  }, [activeSubject]);

  const fetchLog = async () => {
    const { data: logData } = await supabase.from('logs').select('*').eq('subject_id', activeSubject).single();
    if (logData) {
      setLog(logData);
      
      const { data: itemsData } = await supabase.from('log_items').select('*').eq('log_id', logData.id);
      if (itemsData) setItems(itemsData);
      
      const { data: evData } = await supabase.from('log_evidence').select('*').eq('log_id', logData.id);
      if (evData) setEvidence(evData);
    } else {
      setLog(null);
      setItems([]);
      setEvidence([]);
    }
  };

  const createLog = async () => {
    const { data } = await supabase.from('logs').insert([{
      subject_id: activeSubject,
      exam_type: 'Midterm 1',
      marks_received: 0,
      total_marks: 100
    }]).select().single();
    
    if (data) setLog(data);
  };

  if (!activeSubject) {
    return (
      <div className="p-8 text-center bg-surface rounded-2xl m-4 border border-[#1e293b]">
        <p className="text-body text-sm">Please select a Subject in the Hub first.</p>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="p-8 text-center bg-surface rounded-2xl m-4 border border-[#1e293b] space-y-4">
        <p className="text-body text-sm">No Post-Mortem Log exists for this subject yet.</p>
        <button onClick={createLog} className="bg-primary px-4 py-2 rounded-xl text-white font-bold text-sm">Start New Reflection</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 md:pb-8">
      
      {/* Header Section */}
      <div className="space-y-2 mt-2">
        <p className="text-primary text-xs font-semibold tracking-widest uppercase flex items-center gap-2">
          <span className="w-4 h-4 border border-primary rounded-full flex items-center justify-center text-[8px]">↻</span>
          {log.exam_type}
        </p>
        <h2 className="text-3xl font-bold text-header text-aberration">Post-Mortem Log</h2>
        <p className="text-sm text-body leading-relaxed">
          Reviewing performance to recalibrate study strategies for the finals.
        </p>
      </div>

      {/* Component 1: Marks Received */}
      <div className="flex flex-col items-center bg-surface p-6 rounded-2xl border border-[#1e293b]">
        <p className="text-xs text-body font-semibold tracking-widest uppercase mb-4">Marks Received</p>
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#080F1D" strokeWidth="6" strokeDasharray="4 2" />
            <circle 
              cx="50" cy="50" r="45" fill="none" stroke="#4F86F7" strokeWidth="6" 
              strokeDasharray="283" strokeDashoffset={283 * (1 - (log.marks_received/log.total_marks))} strokeLinecap="round" 
            />
          </svg>
          <div className="text-center">
            <span className="text-3xl font-bold text-primary">{log.marks_received}</span>
            <div className="w-8 h-[1px] bg-[#1e293b] mx-auto my-1"></div>
            <span className="text-sm text-body">{log.total_marks}</span>
          </div>
        </div>
        <p className="text-xs text-primary mt-4 font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
          Click to Edit Marks
        </p>
      </div>

      {/* Component 2: Professor's Tips */}
      <section>
        <div className="flex items-center gap-2 text-header font-semibold mb-4 text-lg">
          <CheckCircle2 className="text-primary" size={20} />
          <h3>Actionable Feedback / Tips</h3>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-[#1e293b] space-y-4">
          {items.filter(i => i.type === 'tip').length === 0 && <p className="text-body text-xs">No tips added.</p>}
          {items.filter(i => i.type === 'tip').map((tip, idx) => (
             <div key={tip.id}>
               <TipItem text={tip.text} />
               {idx !== items.filter(i => i.type === 'tip').length - 1 && <Divider />}
             </div>
          ))}
          <button className="text-primary text-xs font-bold">+ Add Tip</button>
        </div>
      </section>

      {/* Component 3: My Drawbacks */}
      <section>
        <div className="flex items-center gap-2 text-header font-semibold mb-4 text-lg">
          <AlertTriangle className="text-red-400" size={20} />
          <h3>My Drawbacks</h3>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-[#1e293b] space-y-4">
          {items.filter(i => i.type === 'drawback').length === 0 && <p className="text-body text-xs">No drawbacks added.</p>}
          {items.filter(i => i.type === 'drawback').map(item => (
            <DrawbackItem key={item.id} text={item.text} />
          ))}
          <button className="text-red-400 text-xs font-bold">+ Add Drawback</button>
        </div>
      </section>

      {/* Component 4: Evidence & Scans */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-header font-semibold text-lg">
            <ImageIcon className="text-primary" size={20} />
            <h3>Evidence & Scans</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
           {evidence.map(ev => (
             <div key={ev.id} className="aspect-square bg-[#080F1D] rounded-xl border border-[#1e293b] relative overflow-hidden flex items-center justify-center">
                <img src={ev.image_url} alt="Evidence" className="object-cover w-full h-full opacity-80" />
             </div>
           ))}
           
           <button className="aspect-square rounded-xl border-2 border-dashed border-[#1e293b] bg-surface/50 flex flex-col items-center justify-center gap-2 hover:bg-surface transition-colors hover:border-primary/50">
              <UploadCloud size={24} className="text-primary" />
              <span className="text-sm font-semibold text-primary">Upload Paper</span>
           </button>
        </div>
      </section>

    </div>
  );
}

// Subcomponents
const Divider = () => <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#1e293b] to-transparent" />;

const TipItem = ({ text }) => (
  <div className="flex gap-3 items-start">
    <div className="mt-1 flex-shrink-0 text-primary">
      <CheckCircle2 size={16} />
    </div>
    <p className="text-body text-sm leading-relaxed">{text}</p>
  </div>
);

const DrawbackItem = ({ text }) => {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-1 flex-shrink-0 text-red-400 bg-red-400/10 p-1 rounded-full border border-red-400/20">
        <AlertTriangle size={12} />
      </div>
      <p className="text-body text-sm leading-relaxed">{text}</p>
    </div>
  );
}
