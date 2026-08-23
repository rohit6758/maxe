import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, UploadCloud, BookOpen, Plus, Image as ImageIcon } from 'lucide-react';

export default function Personals() {
  const { session, activeSubject } = useAppContext();
  
  const [log, setLog] = useState(null);
  const [items, setItems] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeSubject) fetchLog();
    else { setLog(null); setItems([]); setEvidence([]); setNotes(''); }
  }, [activeSubject]);

  const fetchLog = async () => {
    const { data: logData } = await supabase.from('logs').select('*').eq('subject_id', activeSubject).single();
    if (logData) {
      setLog(logData);
      setNotes(logData.notes || '');
      const { data: itemsData } = await supabase.from('log_items').select('*').eq('log_id', logData.id).order('created_at');
      if (itemsData) setItems(itemsData);
      const { data: evData } = await supabase.from('log_evidence').select('*').eq('log_id', logData.id);
      if (evData) setEvidence(evData);
    } else {
      setLog(null); setItems([]); setEvidence([]); setNotes('');
    }
  };

  const createLog = async () => {
    const { data } = await supabase.from('logs').insert([{
      subject_id: activeSubject, exam_type: 'Reflection', marks_received: 0, total_marks: 100, notes: ''
    }]).select().single();
    if (data) setLog(data);
  };

  const handleAddItem = async (type) => {
    const text = prompt(`Enter your ${type === 'tip' ? 'exam tip / strategy' : 'challenge / drawback'}:`);
    if (!text || !log) return;
    const { data } = await supabase.from('log_items').insert([{ log_id: log.id, type, text }]).select();
    if (data) setItems([...items, data[0]]);
  };

  const handleDeleteItem = async (id) => {
    await supabase.from('log_items').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  const handleSaveNotes = async () => {
    if (!log) return;
    setSaving(true);
    await supabase.from('logs').update({ notes }).eq('id', log.id);
    setSaving(false);
  };

  const handleUploadEvidence = async (file) => {
    if (!file || !log) return;
    const filePath = `${session.user.id}/evidence-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('uploads').upload(filePath, file);
    if (error) { alert('Upload failed: ' + error.message); return; }
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
    const { data } = await supabase.from('log_evidence').insert([{ log_id: log.id, image_url: urlData.publicUrl }]).select();
    if (data) setEvidence([...evidence, data[0]]);
  };

  if (!activeSubject) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="glass rounded-2xl p-10 text-center max-w-sm">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-header font-semibold">No subject selected</p>
          <p className="text-body text-sm mt-2">Go to the Hub tab and select a subject first.</p>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="glass rounded-2xl p-10 text-center max-w-sm space-y-4">
          <p className="text-4xl">📝</p>
          <p className="text-header font-semibold">No personal log yet</p>
          <p className="text-body text-sm">Start a reflection log for this subject to track your exam strategies and patterns.</p>
          <button onClick={createLog} className="glass-btn-primary px-6 py-2.5 rounded-xl font-bold text-sm w-full">
            Create Personal Log
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 pb-24 md:pb-8">

      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'rgba(56,189,248,0.15)'}}>
            <BookOpen size={20} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-header text-aberration">Personals</h2>
            <p className="text-body text-sm">Exam tips, patterns & personal study strategies</p>
          </div>
        </div>
      </div>

      {/* Marks Tracker */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="text-header font-bold flex items-center gap-2">🎯 Exam Performance</h3>
        <div className="flex items-center justify-center gap-8">
          <div className="relative w-28 h-28">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="6" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#38bdf8" strokeWidth="6"
                strokeDasharray="201" strokeDashoffset={201 * (1 - log.marks_received / log.total_marks)}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-cyan-400">{log.marks_received}</span>
              <div className="w-8 h-px my-1" style={{background: 'rgba(56,189,248,0.3)'}} />
              <span className="text-xs text-body">{log.total_marks}</span>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={async () => {
                const marks = prompt('Enter marks received:', log.marks_received);
                if (marks === null) return;
                const total = prompt('Enter total marks:', log.total_marks);
                if (total === null) return;
                const { data } = await supabase.from('logs').update({ marks_received: parseFloat(marks), total_marks: parseFloat(total) }).eq('id', log.id).select().single();
                if (data) setLog(data);
              }}
              className="glass-btn px-4 py-2 rounded-xl text-xs font-bold block w-full"
            >
              ✏️ Edit Marks
            </button>
            <p className="text-center text-xs text-body">{Math.round((log.marks_received / log.total_marks) * 100)}% scored</p>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-header font-bold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" /> Tips & Strategies
          </h3>
          <button onClick={() => handleAddItem('tip')} className="glass-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
            <Plus size={12} /> ADD TIP
          </button>
        </div>
        {items.filter(i => i.type === 'tip').length === 0 && (
          <p className="text-body text-sm">No tips yet. Add exam strategies and professor feedback!</p>
        )}
        <div className="space-y-2">
          {items.filter(i => i.type === 'tip').map(tip => (
            <div key={tip.id} className="glass-card rounded-xl p-3 flex items-start gap-3 group">
              <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-body text-sm leading-relaxed flex-1">{tip.text}</p>
              <button onClick={() => handleDeleteItem(tip.id)} className="text-red-400/40 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Drawbacks Section */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-header font-bold flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" /> My Challenges
          </h3>
          <button onClick={() => handleAddItem('drawback')} className="glass-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border-red-400/30 text-red-400">
            <Plus size={12} /> ADD
          </button>
        </div>
        {items.filter(i => i.type === 'drawback').length === 0 && (
          <p className="text-body text-sm">No challenges noted. Honest self-review helps you improve!</p>
        )}
        <div className="space-y-2">
          {items.filter(i => i.type === 'drawback').map(item => (
            <div key={item.id} className="glass-card rounded-xl p-3 flex items-start gap-3 group border-red-400/10">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-body text-sm leading-relaxed flex-1">{item.text}</p>
              <button onClick={() => handleDeleteItem(item.id)} className="text-red-400/40 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Notes */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <h3 className="text-header font-bold flex items-center gap-2">📋 Exam Pattern Notes</h3>
        <p className="text-body text-xs">Write down the exam pattern, expected topics, and personal preparation strategy.</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Mid 1 usually covers Unit 1 & 2. Time-box each question to 15 mins. Practice previous year derivation questions..."
          rows={6}
          className="glass-input w-full rounded-xl p-3 text-sm resize-none"
        />
        <button
          onClick={handleSaveNotes}
          disabled={saving}
          className="glass-btn-primary px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
        >
          {saving ? 'Saving...' : '💾 Save Notes'}
        </button>
      </div>

      {/* Evidence Upload */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <h3 className="text-header font-bold flex items-center gap-2">
          <ImageIcon size={18} className="text-cyan-400" /> Answer Paper Evidence
        </h3>
        <p className="text-body text-xs">Upload scanned/photographed answer papers to review your writing style.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {evidence.map(ev => (
            <a key={ev.id} href={ev.image_url} target="_blank" rel="noreferrer"
              className="aspect-square glass-card rounded-xl overflow-hidden">
              <img src={ev.image_url} alt="Evidence" className="object-cover w-full h-full" />
            </a>
          ))}
          <label className="aspect-square rounded-xl border-2 border-dashed border-cyan-400/20 hover:border-cyan-400/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all" style={{background: 'rgba(56,189,248,0.04)'}}>
            <UploadCloud size={22} className="text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-400 text-center px-2">Upload Paper</span>
            <input type="file" accept="image/*,application/pdf" className="hidden"
              onChange={e => handleUploadEvidence(e.target.files[0])} />
          </label>
        </div>
      </div>
    </div>
  );
}
