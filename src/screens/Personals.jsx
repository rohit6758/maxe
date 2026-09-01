import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, UploadCloud, Plus, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const EXAMS = [
  { id: 'mid1',    label: 'Mid 1',    total: 40,  color: '#6BA898', lightBg: '#EAF4EF', emoji: '📘' },
  { id: 'mid2',    label: 'Mid 2',    total: 40,  color: '#7B9EC8', lightBg: '#EAF0FA', emoji: '📗' },
];

export default function Personals() {
  const { session, activeSemester, activeBranch, userProfile } = useAppContext();

  // Subjects for current semester
  const [subjects, setSubjects] = useState([]);

  // Which subject is expanded
  const [expandedSubject, setExpandedSubject] = useState(null);

  // Which exam is open under that subject
  const [openExam, setOpenExam] = useState(null);   // { subjectId, examId }

  // Log data cache: key = `${subjectId}-${examId}`
  const [logCache, setLogCache] = useState({});       // key → log object
  const [itemCache, setItemCache] = useState({});     // key → [items]
  const [evidenceCache, setEvidenceCache] = useState({}); // key → [evidence]
  const [uploading, setUploading] = useState(false);

  // State for semesters local to Personals in case we didn't visit Hub
  const [localSemesters, setLocalSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(activeSemester);

  // Determine branch reliably
  const branchToUse = activeBranch || userProfile?.branch;

  useEffect(() => {
    if (session && branchToUse) {
      fetchSemesters(branchToUse);
    }
  }, [session, branchToUse]);

  const fetchSemesters = async (branch) => {
    const { data } = await supabase.from('semesters').select('*').eq('user_id', session.user.id).eq('branch', branch).order('name');
    setLocalSemesters(data || []);
    if (data && data.length > 0) {
      // Pick the global activeSemester if it exists, otherwise the first one
      const targetSem = data.find(s => s.id === activeSemester)?.id || data[0].id;
      setSelectedSemester(targetSem);
    } else {
      setSelectedSemester(null);
    }
  };

  useEffect(() => {
    if (selectedSemester) fetchSubjects(selectedSemester);
    else { setSubjects([]); setExpandedSubject(null); setOpenExam(null); }
  }, [selectedSemester]);

  const fetchSubjects = async (semId) => {
    const { data } = await supabase.from('subjects').select('*').eq('semester_id', semId).order('name');
    setSubjects(data || []);
  };



  const cacheKey = (subjectId, examId) => `${subjectId}-${examId}`;

  const openExamLog = async (subjectId, examId) => {
    const key = cacheKey(subjectId, examId);

    // Toggle off
    if (openExam?.subjectId === subjectId && openExam?.examId === examId) {
      setOpenExam(null);
      return;
    }

    // Already loaded
    if (logCache[key] !== undefined) {
      setOpenExam({ subjectId, examId });
      return;
    }

    const cfg = EXAMS.find(e => e.id === examId);

    // Fetch or create log
    const { data: existing } = await supabase.from('logs').select('*')
      .eq('subject_id', subjectId).eq('exam_type', examId).maybeSingle();

    let log = existing;
    if (!log) {
      const { data: created } = await supabase.from('logs').insert([{
        subject_id: subjectId, exam_type: examId,
        marks_received: 0, total_marks: cfg.total
      }]).select().single();
      log = created;
    }

    const { data: itemData } = await supabase.from('log_items').select('*').eq('log_id', log.id).order('created_at');
    const { data: evData } = await supabase.from('log_evidence').select('*').eq('log_id', log.id);

    setLogCache(p => ({ ...p, [key]: log }));
    setItemCache(p => ({ ...p, [key]: itemData || [] }));
    setEvidenceCache(p => ({ ...p, [key]: evData || [] }));
    setOpenExam({ subjectId, examId });
  };

  const updateMarks = async (subjectId, examId, value) => {
    const key = cacheKey(subjectId, examId);
    const log = logCache[key];
    if (!log) return;
    const { data } = await supabase.from('logs').update({ marks_received: parseFloat(value) || 0 }).eq('id', log.id).select().single();
    if (data) setLogCache(p => ({ ...p, [key]: data }));
  };

  const addItem = async (subjectId, examId, type) => {
    const key = cacheKey(subjectId, examId);
    const log = logCache[key];
    if (!log) return;
    const text = prompt(type === 'tip' ? 'Enter tip or strategy:' : 'Enter a challenge:');
    if (!text) return;
    const { data } = await supabase.from('log_items').insert([{ log_id: log.id, type, text }]).select();
    if (data) setItemCache(p => ({ ...p, [key]: [...(p[key] || []), data[0]] }));
  };

  const deleteItem = async (subjectId, examId, itemId) => {
    const key = cacheKey(subjectId, examId);
    await supabase.from('log_items').delete().eq('id', itemId);
    setItemCache(p => ({ ...p, [key]: (p[key] || []).filter(i => i.id !== itemId) }));
  };

  const uploadEvidence = async (subjectId, examId, file) => {
    const key = cacheKey(subjectId, examId);
    const log = logCache[key];
    if (!file || !log) return;
    setUploading(true);
    const path = `${session.user.id}/ev-${examId}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('uploads').upload(path, file);
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);
    const { data } = await supabase.from('log_evidence').insert([{ log_id: log.id, image_url: urlData.publicUrl }]).select();
    if (data) setEvidenceCache(p => ({ ...p, [key]: [...(p[key] || []), data[0]] }));
    setUploading(false);
  };

  const deleteEvidence = async (subjectId, examId, evId) => {
    const key = cacheKey(subjectId, examId);
    if (!confirm('Delete this uploaded file?')) return;
    await supabase.from('log_evidence').delete().eq('id', evId);
    setEvidenceCache(p => ({ ...p, [key]: (p[key] || []).filter(e => e.id !== evId) }));
  };

  // ── No semester selected ──
  if (!selectedSemester) {
    return (
      <div className="card p-10 text-center">
        <p className="text-4xl mb-3">📖</p>
        <p className="font-bold text-lg" style={{color:'#2D4A3E'}}>No semester selected</p>
        <p className="text-sm mt-2" style={{color:'#6BA898'}}>
          Go to <strong>Hub</strong>, pick your branch and semester first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="card p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-aberration" style={{color:'#2D4A3E'}}>Improvements</h2>
          <p className="text-sm mt-0.5" style={{color:'#6BA898'}}>Select a subject to view exam reflections</p>
        </div>
        {localSemesters.length > 0 && (
          <select 
            className="app-input text-xs py-1.5 px-2 bg-background font-bold shadow-sm" 
            style={{color: '#2D4A3E', borderColor: 'rgba(107,168,152,0.3)', width: 'auto'}}
            value={selectedSemester || ''} 
            onChange={e => setSelectedSemester(e.target.value)}
          >
            {localSemesters.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Subjects list */}
      {subjects.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-3xl mb-2">📝</p>
          <p className="font-semibold" style={{color:'#2D4A3E'}}>No subjects yet</p>
          <p className="text-sm mt-1" style={{color:'#6BA898'}}>Add subjects in the Hub tab first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map(subject => {
            const isExpanded = expandedSubject === subject.id;
            return (
              <div key={subject.id} className="card overflow-hidden">
                {/* Subject header row */}
                <button
                  onClick={() => {
                    setExpandedSubject(isExpanded ? null : subject.id);
                    setOpenExam(null);
                  }}
                  className="w-full flex items-center justify-between p-4 transition-colors"
                  style={{background: isExpanded ? '#EAF4EF' : '#FFFFFF'}}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold" style={{background:'rgba(107,168,152,0.15)', color:'#6BA898'}}>
                      {subject.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold" style={{color:'#2D4A3E'}}>{subject.name}</p>
                      <p className="text-xs" style={{color:'#6BA898'}}>Tap to view exams</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} style={{color:'#6BA898'}} /> : <ChevronDown size={18} style={{color:'#A8C5B8'}} />}
                </button>

                {/* Exam tabs */}
                {isExpanded && (
                  <div className="border-t" style={{borderColor:'rgba(107,168,152,0.15)'}}>
                    <div className="flex gap-2 p-3" style={{background:'#F5FAF7'}}>
                      {EXAMS.map(exam => {
                        const key = cacheKey(subject.id, exam.id);
                        const log = logCache[key];
                        const isOpen = openExam?.subjectId === subject.id && openExam?.examId === exam.id;
                        return (
                          <button
                            key={exam.id}
                            onClick={() => openExamLog(subject.id, exam.id)}
                            className="flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5"
                            style={{
                              background: isOpen ? exam.color : exam.lightBg,
                              color: isOpen ? '#FFFFFF' : exam.color,
                              border: `1.5px solid ${isOpen ? exam.color : 'transparent'}`,
                            }}
                          >
                            <span>{exam.emoji}</span>
                            <span>{exam.label}</span>
                            {log && <span className="font-normal opacity-80">{log.marks_received}/{exam.total}</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Exam detail panel */}
                    {openExam?.subjectId === subject.id && (() => {
                      const { examId } = openExam;
                      const cfg = EXAMS.find(e => e.id === examId);
                      const key = cacheKey(subject.id, examId);
                      const log = logCache[key] || {};
                      const examItems = itemCache[key] || [];
                      const examEvidence = evidenceCache[key] || [];
                      const pct = log.total_marks > 0 ? Math.round((log.marks_received / log.total_marks) * 100) : 0;
                      const c = 2 * Math.PI * 26;

                      return (
                        <div className="p-4 space-y-4" style={{background:'#FAFEFE'}}>

                          {/* Marks */}
                          <div className="card-sm p-4 flex items-center gap-5">
                            <div className="relative w-16 h-16 shrink-0">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                                <circle cx="30" cy="30" r="26" fill="none" stroke={`${cfg.color}22`} strokeWidth="5" />
                                <circle cx="30" cy="30" r="26" fill="none" stroke={cfg.color} strokeWidth="5"
                                  strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} strokeLinecap="round" />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-sm font-bold" style={{color: cfg.color}}>{log.marks_received || 0}</span>
                                <span className="text-[9px]" style={{color:'#A8C5B8'}}>{pct}%</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold mb-1.5" style={{color:'#5E7A6E'}}>Marks out of {cfg.total}</p>
                              <input
                                type="number" min="0" max={cfg.total}
                                key={`${key}-marks`}
                                defaultValue={log.marks_received || 0}
                                onBlur={e => updateMarks(subject.id, examId, e.target.value)}
                                className="app-input text-center text-sm"
                                style={{padding:'8px', borderColor: `${cfg.color}40`}}
                              />
                            </div>
                          </div>

                          {/* Tips */}
                          <div className="card-sm p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm flex items-center gap-2" style={{color:'#2D4A3E'}}>
                                <CheckCircle2 size={15} style={{color:'#6BA898'}} /> Tips & Tricks
                              </p>
                              <button onClick={() => addItem(subject.id, examId, 'tip')} className="btn-outline text-xs flex items-center gap-1 py-1 px-2">
                                <Plus size={11} /> Add
                              </button>
                            </div>
                            {examItems.filter(i => i.type === 'tip').length === 0
                              ? <p className="text-xs" style={{color:'#A8C5B8'}}>No tips yet.</p>
                              : examItems.filter(i => i.type === 'tip').map(tip => (
                                <div key={tip.id} className="flex items-start gap-2 group">
                                  <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{color:'#6BA898'}} />
                                  <p className="text-sm flex-1 leading-relaxed" style={{color:'#3D6B5E'}}>{tip.text}</p>
                                  <button onClick={() => deleteItem(subject.id, examId, tip.id)}
                                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{color:'#E57373'}}>✕</button>
                                </div>
                              ))
                            }
                          </div>

                          {/* Challenges */}
                          <div className="card-sm p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm flex items-center gap-2" style={{color:'#2D4A3E'}}>
                                <AlertTriangle size={15} style={{color:'#E8945A'}} /> Challenges
                              </p>
                              <button onClick={() => addItem(subject.id, examId, 'drawback')} className="btn-outline text-xs flex items-center gap-1 py-1 px-2" style={{color:'#E8945A', borderColor:'rgba(232,148,90,0.3)'}}>
                                <Plus size={11} /> Add
                              </button>
                            </div>
                            {examItems.filter(i => i.type === 'drawback').length === 0
                              ? <p className="text-xs" style={{color:'#A8C5B8'}}>No challenges noted.</p>
                              : examItems.filter(i => i.type === 'drawback').map(item => (
                                <div key={item.id} className="flex items-start gap-2 group">
                                  <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{color:'#E8945A'}} />
                                  <p className="text-sm flex-1 leading-relaxed" style={{color:'#3D6B5E'}}>{item.text}</p>
                                  <button onClick={() => deleteItem(subject.id, examId, item.id)}
                                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{color:'#E57373'}}>✕</button>
                                </div>
                              ))
                            }
                          </div>

                          {/* Evidence */}
                          <div className="card-sm p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm flex items-center gap-2" style={{color:'#2D4A3E'}}>
                                <FileText size={15} style={{color: cfg.color}} /> Answer Papers
                              </p>
                              {uploading && <span className="text-xs animate-pulse" style={{color: cfg.color}}>Uploading...</span>}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {examEvidence.map(ev => (
                                <div key={ev.id} className="relative group aspect-square rounded-xl overflow-hidden" style={{background:'#EAF4EF', border:`1px solid ${cfg.color}30`}}>
                                  <a href={ev.image_url} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center">
                                    {ev.image_url.match(/\.pdf$/i)
                                      ? <div className="flex flex-col items-center gap-1"><FileText size={20} style={{color:cfg.color}} /><span className="text-[9px] font-bold" style={{color:cfg.color}}>PDF</span></div>
                                      : <img src={ev.image_url} alt="evidence" className="object-cover w-full h-full" />}
                                  </a>
                                  <button onClick={() => deleteEvidence(subject.id, examId, ev.id)} className="absolute top-1 right-1 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm" style={{color:'#DC6B6B'}}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                              <label className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-[1.03] transition-transform"
                                style={{borderColor:`${cfg.color}40`, background:`${cfg.lightBg}`}}>
                                <UploadCloud size={18} style={{color: cfg.color}} />
                                <span className="text-[9px] font-bold text-center" style={{color: cfg.color}}>Upload</span>
                                <input type="file" accept="image/*,application/pdf" className="hidden"
                                  onChange={e => uploadEvidence(subject.id, examId, e.target.files[0])} />
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
