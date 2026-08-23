import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, UploadCloud, Plus, Trash2, FileText, ChevronRight } from 'lucide-react';

// Per-exam config
const EXAMS = [
  {
    id: 'mid1',
    label: 'Mid 1',
    total: 40,
    color: '#CCCCFF',       // Lavender Blue
    glow: 'rgba(204,204,255,0.25)',
    border: 'rgba(204,204,255,0.3)',
    bg: 'rgba(30,20,80,0.45)',
    ring: '#CCCCFF',
    icon: '📘',
  },
  {
    id: 'mid2',
    label: 'Mid 2',
    total: 40,
    color: '#6495ED',       // Cornflower Blue
    glow: 'rgba(100,149,237,0.25)',
    border: 'rgba(100,149,237,0.3)',
    bg: 'rgba(15,20,65,0.45)',
    ring: '#6495ED',
    icon: '📗',
  },
  {
    id: 'semester',
    label: 'Semester',
    total: 100,
    color: '#0C98FF',       // Starfleet Blue
    glow: 'rgba(12,152,255,0.25)',
    border: 'rgba(12,152,255,0.3)',
    bg: 'rgba(5,20,60,0.45)',
    ring: '#0C98FF',
    icon: '📙',
  },
];

export default function Personals() {
  const { session, activeSubject, subjects } = useAppContext();

  // Which exam tab is open
  const [activeExam, setActiveExam] = useState(null);

  // Per-exam log cache: { mid1: {...}, mid2: {...}, semester: {...} }
  const [logs, setLogs] = useState({});
  const [items, setItems] = useState({});    // { mid1: [], mid2: [], semester: [] }
  const [evidence, setEvidence] = useState({}); // { mid1: [], ... }
  const [uploading, setUploading] = useState(false);

  // Reset when subject changes
  useEffect(() => {
    setActiveExam(null);
    setLogs({});
    setItems({});
    setEvidence({});
  }, [activeSubject]);

  // Load a specific exam's log when selected
  const loadExam = async (examId) => {
    if (!activeSubject) return;

    // Already loaded?
    if (logs[examId] !== undefined) {
      setActiveExam(examId);
      return;
    }

    // Fetch or create log
    const { data: existing } = await supabase
      .from('logs')
      .select('*')
      .eq('subject_id', activeSubject)
      .eq('exam_type', examId)
      .maybeSingle();

    let log = existing;
    if (!log) {
      const cfg = EXAMS.find(e => e.id === examId);
      const { data: created } = await supabase.from('logs').insert([{
        subject_id: activeSubject,
        exam_type: examId,
        marks_received: 0,
        total_marks: cfg.total,
      }]).select().single();
      log = created;
    }

    if (!log) return;

    const { data: itemData } = await supabase.from('log_items').select('*').eq('log_id', log.id).order('created_at');
    const { data: evData } = await supabase.from('log_evidence').select('*').eq('log_id', log.id);

    setLogs(prev => ({ ...prev, [examId]: log }));
    setItems(prev => ({ ...prev, [examId]: itemData || [] }));
    setEvidence(prev => ({ ...prev, [examId]: evData || [] }));
    setActiveExam(examId);
  };

  const updateMarks = async (examId, marks) => {
    const log = logs[examId];
    if (!log) return;
    const { data } = await supabase.from('logs').update({ marks_received: parseFloat(marks) || 0 }).eq('id', log.id).select().single();
    if (data) setLogs(prev => ({ ...prev, [examId]: data }));
  };

  const addItem = async (examId, type) => {
    const log = logs[examId];
    if (!log) return;
    const text = prompt(type === 'tip' ? 'Enter exam tip or strategy:' : 'Enter a challenge or drawback:');
    if (!text) return;
    const { data } = await supabase.from('log_items').insert([{ log_id: log.id, type, text }]).select();
    if (data) setItems(prev => ({ ...prev, [examId]: [...(prev[examId] || []), data[0]] }));
  };

  const deleteItem = async (examId, itemId) => {
    await supabase.from('log_items').delete().eq('id', itemId);
    setItems(prev => ({ ...prev, [examId]: (prev[examId] || []).filter(i => i.id !== itemId) }));
  };

  const uploadEvidence = async (examId, file) => {
    const log = logs[examId];
    if (!file || !log) return;
    setUploading(true);
    const filePath = `${session.user.id}/evidence-${examId}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('uploads').upload(filePath, file);
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
    const { data } = await supabase.from('log_evidence').insert([{ log_id: log.id, image_url: urlData.publicUrl }]).select();
    if (data) setEvidence(prev => ({ ...prev, [examId]: [...(prev[examId] || []), data[0]] }));
    setUploading(false);
  };

  if (!activeSubject) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[70vh]">
        <div className="glass-lavender rounded-2xl p-10 text-center max-w-sm" style={{boxShadow: '0 8px 32px rgba(204,204,255,0.07)'}}>
          <p className="text-5xl mb-4">📖</p>
          <p className="font-bold text-lg" style={{color: '#CCCCFF'}}>No subject selected</p>
          <p className="text-sm mt-2" style={{color: '#91ABD0'}}>
            Go to the <span style={{color: '#87CEFA'}}>Hub</span> tab, select your branch, semester, and a subject first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24 md:pb-8">

      {/* Header */}
      <div className="glass rounded-2xl p-5" style={{borderColor: 'rgba(135,206,250,0.15)'}}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{background: 'rgba(100,149,237,0.18)', border: '1px solid rgba(100,149,237,0.3)'}}>
            📖
          </div>
          <div>
            <h2 className="text-2xl font-bold text-aberration" style={{color: '#F0F8FF'}}>Personals</h2>
            <p className="text-sm" style={{color: '#91ABD0'}}>Select an exam to view your reflection log</p>
          </div>
        </div>
      </div>

      {/* Exam selector cards */}
      {activeExam === null && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest font-bold px-1" style={{color: '#7393B3'}}>Choose Exam</p>
          {EXAMS.map(exam => (
            <button
              key={exam.id}
              onClick={() => loadExam(exam.id)}
              className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.01] flex items-center justify-between"
              style={{
                background: exam.bg,
                border: `1px solid ${exam.border}`,
                backdropFilter: 'blur(14px)',
                boxShadow: `0 4px 24px ${exam.glow}`,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{exam.icon}</div>
                <div>
                  <p className="font-bold text-lg" style={{color: exam.color}}>{exam.label}</p>
                  <p className="text-sm" style={{color: '#7393B3'}}>Out of {exam.total} marks</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {logs[exam.id] && (
                  <span className="text-sm font-bold" style={{color: exam.color}}>
                    {logs[exam.id].marks_received}/{exam.total}
                  </span>
                )}
                <ChevronRight size={20} style={{color: exam.color}} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Exam Detail View */}
      {activeExam && (() => {
        const cfg = EXAMS.find(e => e.id === activeExam);
        const log = logs[activeExam] || {};
        const examItems = items[activeExam] || [];
        const examEvidence = evidence[activeExam] || [];
        const pct = log.total_marks > 0 ? Math.round((log.marks_received / log.total_marks) * 100) : 0;
        const circumference = 2 * Math.PI * 34; // r=34

        return (
          <div className="space-y-4">
            {/* Back + Exam header */}
            <div className="rounded-2xl p-5" style={{background: cfg.bg, border: `1px solid ${cfg.border}`, backdropFilter: 'blur(16px)', boxShadow: `0 8px 32px ${cfg.glow}`}}>
              <button
                onClick={() => setActiveExam(null)}
                className="text-xs font-bold mb-4 flex items-center gap-1 hover:opacity-70 transition-opacity"
                style={{color: cfg.color}}
              >
                ← Back to exams
              </button>
              <div className="flex items-center gap-4">
                <span className="text-4xl">{cfg.icon}</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{color: cfg.color}}>
                    {cfg.label} · {cfg.total} Marks
                  </p>
                  <h3 className="text-2xl font-bold" style={{color: '#F0F8FF'}}>Exam Reflection</h3>
                </div>
              </div>
            </div>

            {/* Marks Ring */}
            <div className="glass rounded-2xl p-5" style={{borderColor: cfg.border}}>
              <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{color: '#7393B3'}}>Marks Scored</p>
              <div className="flex items-center gap-6">
                {/* SVG Ring */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke={cfg.ring} strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - pct / 100)}
                      strokeLinecap="round"
                      style={{filter: `drop-shadow(0 0 6px ${cfg.ring})`}}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold" style={{color: cfg.color}}>{log.marks_received || 0}</span>
                    <span className="text-[9px]" style={{color: '#7393B3'}}>{pct}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{color: '#7393B3'}}>Marks Received</label>
                    <input
                      type="number" min="0" max={cfg.total}
                      defaultValue={log.marks_received || 0}
                      key={log.id}
                      onBlur={e => updateMarks(activeExam, e.target.value)}
                      className="glass-input w-full rounded-xl p-2.5 text-sm text-center"
                      style={{borderColor: cfg.border}}
                    />
                  </div>
                  <p className="text-xs" style={{color: '#7393B3'}}>Total: {cfg.total} marks</p>
                </div>
              </div>
            </div>

            {/* Tips & Tricks */}
            <div className="glass-lavender rounded-2xl p-5 space-y-3" style={{borderColor: 'rgba(204,204,255,0.2)'}}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2" style={{color: '#E6E6FA'}}>
                  <CheckCircle2 size={17} style={{color: '#BCEFFD'}} />
                  Tips & Tricks
                </h3>
                <button
                  onClick={() => addItem(activeExam, 'tip')}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                  style={{background: 'rgba(188,239,253,0.12)', border: '1px solid rgba(188,239,253,0.25)', color: '#BCEFFD'}}
                >
                  <Plus size={11} /> ADD TIP
                </button>
              </div>
              {examItems.filter(i => i.type === 'tip').length === 0 ? (
                <p className="text-sm" style={{color: '#7393B3'}}>No tips yet. Add strategies and professor feedback!</p>
              ) : (
                <div className="space-y-2">
                  {examItems.filter(i => i.type === 'tip').map(tip => (
                    <div key={tip.id} className="flex items-start gap-3 p-3 rounded-xl group"
                      style={{background: 'rgba(188,239,253,0.06)', border: '1px solid rgba(188,239,253,0.1)'}}>
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{color: '#BCEFFD'}} />
                      <p className="text-sm flex-1 leading-relaxed" style={{color: '#B0C4DE'}}>{tip.text}</p>
                      <button onClick={() => deleteItem(activeExam, tip.id)}
                        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{color: 'rgba(239,68,68,0.6)'}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawbacks / Challenges */}
            <div className="glass-cornflower rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2" style={{color: '#E6E6FA'}}>
                  <AlertTriangle size={17} style={{color: '#87CEFA'}} />
                  Challenges
                </h3>
                <button
                  onClick={() => addItem(activeExam, 'drawback')}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                  style={{background: 'rgba(135,206,250,0.1)', border: '1px solid rgba(135,206,250,0.2)', color: '#87CEFA'}}
                >
                  <Plus size={11} /> ADD
                </button>
              </div>
              {examItems.filter(i => i.type === 'drawback').length === 0 ? (
                <p className="text-sm" style={{color: '#7393B3'}}>No challenges noted. Honest reflection helps you improve!</p>
              ) : (
                <div className="space-y-2">
                  {examItems.filter(i => i.type === 'drawback').map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl group"
                      style={{background: 'rgba(100,149,237,0.08)', border: '1px solid rgba(100,149,237,0.15)'}}>
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" style={{color: '#87CEFA'}} />
                      <p className="text-sm flex-1 leading-relaxed" style={{color: '#B0C4DE'}}>{item.text}</p>
                      <button onClick={() => deleteItem(activeExam, item.id)}
                        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{color: 'rgba(239,68,68,0.6)'}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Evidence / Answer Paper Upload */}
            <div className="glass-sky rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2" style={{color: '#F0F8FF'}}>
                  <FileText size={17} style={{color: cfg.color}} />
                  Answer Paper Evidence
                </h3>
                {uploading && <span className="text-xs animate-pulse" style={{color: cfg.color}}>Uploading...</span>}
              </div>
              <p className="text-xs" style={{color: '#7393B3'}}>Upload photos or PDFs of your answer paper for review.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {examEvidence.map(ev => (
                  <a key={ev.id} href={ev.image_url} target="_blank" rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden flex items-center justify-center group relative"
                    style={{border: `1px solid ${cfg.border}`, background: 'rgba(5,15,40,0.5)'}}>
                    {ev.image_url.match(/\.(pdf)$/i) ? (
                      <div className="flex flex-col items-center gap-1">
                        <FileText size={28} style={{color: cfg.color}} />
                        <span className="text-[10px] font-bold" style={{color: cfg.color}}>PDF</span>
                      </div>
                    ) : (
                      <img src={ev.image_url} alt="Evidence" className="object-cover w-full h-full" />
                    )}
                  </a>
                ))}
                <label
                  className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                  style={{borderColor: `${cfg.border}`, background: `${cfg.bg}80`}}
                >
                  <UploadCloud size={22} style={{color: cfg.color}} />
                  <span className="text-xs font-semibold text-center px-2" style={{color: cfg.color}}>
                    Upload Paper
                  </span>
                  <input
                    type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={e => uploadEvidence(activeExam, e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
