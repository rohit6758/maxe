import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { FileText, MessageSquare, Link as LinkIcon, UploadCloud, Video, Plus, Target, ClipboardList } from 'lucide-react';

const BRANCHES = ['CSE', 'CSM', 'IT', 'CSC', 'EEE', 'MECH', 'CIVIL', 'ECE'];
const SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

export default function Aggregator() {
  const { session, activeBranch, setActiveBranch, activeSemester, setActiveSemester, activeSubject, setActiveSubject } = useAppContext();
  
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [chats, setChats] = useState([]);
  const [targetMarks, setTargetMarks] = useState(null);
  const [activeTab, setActiveTab] = useState('links');
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '' });

  useEffect(() => {
    if (session && activeBranch) fetchSemesters();
    else { setSemesters([]); setActiveSemester(null); }
  }, [session, activeBranch]);

  useEffect(() => {
    if (activeSemester) fetchSubjects();
    else { setSubjects([]); setActiveSubject(null); }
  }, [activeSemester]);

  useEffect(() => {
    if (activeSubject) {
      fetchResources();
      fetchChats();
      fetchTargetMarks();
    } else {
      setResources([]); setChats([]); setTargetMarks(null);
    }
  }, [activeSubject]);

  const fetchSemesters = async () => {
    const { data } = await supabase.from('semesters').select('*')
      .eq('user_id', session.user.id)
      .eq('branch', activeBranch)
      .order('name');
    setSemesters(data || []);
    if (!activeSemester) {
      if (data && data.length > 0) setActiveSemester(data[0].id);
      else setActiveSemester(null);
    }
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').eq('semester_id', activeSemester).order('name');
    setSubjects(data || []);
    if (!activeSubject) {
      if (data && data.length > 0) setActiveSubject(data[0].id);
      else setActiveSubject(null);
    }
  };

  const fetchResources = async () => {
    const { data } = await supabase.from('resources').select('*').eq('subject_id', activeSubject).order('created_at', { ascending: false });
    setResources(data || []);
  };

  const fetchChats = async () => {
    const { data } = await supabase.from('chat_history').select('*').eq('subject_id', activeSubject).order('created_at', { ascending: false });
    setChats(data || []);
  };

  const fetchTargetMarks = async () => {
    const { data } = await supabase.from('target_marks').select('*').eq('subject_id', activeSubject).single();
    setTargetMarks(data || null);
  };

  const handleCreateSemester = async () => {
    if (!activeBranch) { alert('Select a branch first.'); return; }
    const semLabel = prompt('Enter Semester (e.g., 1-1, 2-2):');
    if (!semLabel) return;
    const { data } = await supabase.from('semesters').insert([{ user_id: session.user.id, name: semLabel, branch: activeBranch }]).select();
    if (data) { setSemesters([...semesters, data[0]]); setActiveSemester(data[0].id); }
  };

  const handleCreateSubject = async () => {
    if (!activeSemester) { alert('Select a semester first.'); return; }
    const name = prompt('Enter Subject Name:');
    if (!name) return;
    const { data } = await supabase.from('subjects').insert([{ semester_id: activeSemester, name }]).select();
    if (data) { setSubjects([...subjects, data[0]]); setActiveSubject(data[0].id); }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url || !activeSubject) return;
    let type = 'link';
    if (newLink.url.includes('youtube.com') || newLink.url.includes('youtu.be')) type = 'youtube';
    const { data } = await supabase.from('resources').insert([{ subject_id: activeSubject, title: newLink.title, url: newLink.url, type }]).select();
    if (data) { setResources([data[0], ...resources]); setShowAddLink(false); setNewLink({ title: '', url: '' }); }
  };

  const handleUpload = async (file, type) => {
    if (!file || !activeSubject) return;
    const filePath = `${session.user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);
    if (uploadError) { alert('Upload failed: ' + uploadError.message); return; }
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
    const { data } = await supabase.from('resources').insert([{
      subject_id: activeSubject, title: file.name, url: urlData.publicUrl, type,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    }]).select();
    if (data) setResources([data[0], ...resources]);
  };

  const handleSaveTargetMarks = async (field, value) => {
    if (!activeSubject) return;
    if (targetMarks) {
      const { data } = await supabase.from('target_marks').update({ [field]: parseInt(value) || 0 }).eq('id', targetMarks.id).select().single();
      if (data) setTargetMarks(data);
    } else {
      const { data } = await supabase.from('target_marks').insert([{ subject_id: activeSubject, [field]: parseInt(value) || 0 }]).select().single();
      if (data) setTargetMarks(data);
    }
  };

  const handleSaveAIChat = async () => {
    const query = prompt('Your question to the AI:');
    if (!query) return;
    const response = prompt('Paste the AI\'s answer:');
    if (!response) return;
    const { data } = await supabase.from('chat_history').insert([{ subject_id: activeSubject, query, response }]).select();
    if (data) setChats([data[0], ...chats]);
  };

  const subjectName = subjects.find(s => s.id === activeSubject)?.name || 'Subject';
  const semesterName = semesters.find(s => s.id === activeSemester)?.name || '';

  const TABS = [
    { id: 'links', label: 'Links & Media', icon: <LinkIcon size={14} /> },
    { id: 'notes', label: 'PDF Notes', icon: <FileText size={14} /> },
    { id: 'papers', label: 'Question Papers', icon: <ClipboardList size={14} /> },
    { id: 'targets', label: 'Target Marks', icon: <Target size={14} /> },
    { id: 'ai', label: 'AI Chats', icon: <MessageSquare size={14} /> },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 pb-24 md:pb-8">
      
      {/* ── Funnel: Branch → Semester → Subject ── */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="text-xs text-cyan-400/60 uppercase tracking-widest font-bold">Select Your Context</p>

        {/* Step 1: Branch */}
        <div className="space-y-1">
          <label className="text-xs text-body font-semibold">① Branch</label>
          <div className="flex flex-wrap gap-2">
            {BRANCHES.map(b => (
              <button
                key={b}
                onClick={() => { setActiveBranch(b); setActiveSemester(null); setActiveSubject(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeBranch === b
                    ? 'glass-btn-primary'
                    : 'glass-btn'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Semester */}
        {activeBranch && (
          <div className="space-y-1">
            <label className="text-xs text-body font-semibold">② Semester</label>
            <div className="flex gap-2">
              <select
                className="glass-input rounded-xl p-2 text-sm flex-1 cursor-pointer"
                value={activeSemester || ''}
                onChange={e => { setActiveSemester(e.target.value); setActiveSubject(null); }}
              >
                <option value="" disabled>Select semester</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={handleCreateSemester} className="glass-btn px-3 rounded-xl font-bold text-lg">+</button>
            </div>
          </div>
        )}

        {/* Step 3: Subject */}
        {activeSemester && (
          <div className="space-y-1">
            <label className="text-xs text-body font-semibold">③ Subject</label>
            <div className="flex gap-2">
              <select
                className="glass-input rounded-xl p-2 text-sm flex-1 cursor-pointer"
                value={activeSubject || ''}
                onChange={e => setActiveSubject(e.target.value)}
              >
                <option value="" disabled>Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={handleCreateSubject} className="glass-btn px-3 rounded-xl font-bold text-lg">+</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Subject Dashboard ── */}
      {!activeBranch ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">🎓</p>
          <p className="text-header font-semibold">Select your branch to get started</p>
          <p className="text-body text-sm mt-1">Choose from CSE, IT, EEE and more above</p>
        </div>
      ) : !activeSubject ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-header font-semibold">Select a subject to view resources</p>
          <p className="text-body text-sm mt-1">
            {activeSemester ? 'Pick a subject from the dropdown above' : 'First pick a semester'}
          </p>
        </div>
      ) : (
        <>
          {/* Subject Header */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-cyan-400/60 uppercase tracking-widest font-bold">{activeBranch} · {semesterName}</p>
                <h2 className="text-2xl font-bold text-header text-aberration mt-1">{subjectName}</h2>
                <p className="text-body text-sm mt-1">Learning materials and study resources</p>
              </div>
              <div className="text-right text-xs text-body">
                <p>{resources.length} resources</p>
                <p className="mt-0.5">{chats.length} AI chats</p>
              </div>
            </div>
          </div>

          {/* Tab Nav */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id ? 'glass-btn-primary' : 'glass-btn'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Links & Media ── */}
          {activeTab === 'links' && (
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-header font-bold flex items-center gap-2"><LinkIcon size={16} className="text-cyan-400" /> Web & Video Links</h3>
                <button onClick={() => setShowAddLink(!showAddLink)} className="glass-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Plus size={12} /> ADD
                </button>
              </div>

              {showAddLink && (
                <form onSubmit={handleAddLink} className="glass-card rounded-xl p-4 space-y-3">
                  <input
                    type="text" placeholder="Resource name" required
                    value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})}
                    className="glass-input w-full rounded-lg p-2 text-sm"
                  />
                  <input
                    type="url" placeholder="https://..." required
                    value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})}
                    className="glass-input w-full rounded-lg p-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="glass-btn-primary flex-1 py-2 rounded-lg text-xs">Save Link</button>
                    <button type="button" onClick={() => setShowAddLink(false)} className="glass-btn flex-1 py-2 rounded-lg text-xs">Cancel</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resources.filter(r => r.type === 'link' || r.type === 'youtube').length === 0 && (
                  <p className="text-body text-sm col-span-2">No links yet. Add one above!</p>
                )}
                {resources.filter(r => r.type === 'link' || r.type === 'youtube').map(res => (
                  <a key={res.id} href={res.url} target="_blank" rel="noreferrer"
                    className="glass-card rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background: 'rgba(56,189,248,0.15)'}}>
                      {res.type === 'youtube' ? <Video size={18} className="text-red-400" /> : <LinkIcon size={18} className="text-cyan-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-header font-medium text-sm truncate">{res.title}</p>
                      <p className="text-body text-xs truncate mt-0.5">{res.url}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: PDF Notes ── */}
          {activeTab === 'notes' && (
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-header font-bold flex items-center gap-2"><FileText size={16} className="text-cyan-400" /> PDF Notes</h3>
                <label className="glass-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
                  <UploadCloud size={12} /> UPLOAD
                  <input type="file" accept="application/pdf" className="hidden" onChange={e => handleUpload(e.target.files[0], 'pdf')} />
                </label>
              </div>
              <div className="space-y-2">
                {resources.filter(r => r.type === 'pdf').length === 0 && (
                  <p className="text-body text-sm">No PDFs uploaded yet.</p>
                )}
                {resources.filter(r => r.type === 'pdf').map(res => (
                  <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="glass-card rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background: 'rgba(56,189,248,0.15)'}}>
                      <FileText size={18} className="text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-header font-medium text-sm truncate">{res.title}</p>
                      <p className="text-body text-xs mt-0.5">{res.size || ''} · {new Date(res.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs glass-btn px-2 py-1 rounded-lg">Open ↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: Question Papers ── */}
          {activeTab === 'papers' && (
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-header font-bold flex items-center gap-2"><ClipboardList size={16} className="text-cyan-400" /> Question Papers</h3>
                <label className="glass-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
                  <UploadCloud size={12} /> UPLOAD
                  <input type="file" accept="application/pdf,image/*" className="hidden"
                    onChange={e => handleUpload(e.target.files[0], 'question_paper')} />
                </label>
              </div>
              <p className="text-body text-xs">Upload previous year / senior question papers here for revision.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resources.filter(r => r.type === 'question_paper').length === 0 && (
                  <p className="text-body text-sm col-span-2">No question papers uploaded yet.</p>
                )}
                {resources.filter(r => r.type === 'question_paper').map(res => (
                  <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="glass-card rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background: 'rgba(56,189,248,0.15)'}}>
                      <ClipboardList size={18} className="text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-header font-medium text-sm truncate">{res.title}</p>
                      <p className="text-body text-xs mt-0.5">{res.size || ''} · {new Date(res.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs glass-btn px-2 py-1 rounded-lg">Open ↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: Target Marks & Evidence ── */}
          {activeTab === 'targets' && (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-4 space-y-4">
                <h3 className="text-header font-bold flex items-center gap-2"><Target size={16} className="text-cyan-400" /> Target & Actual Marks</h3>
                <p className="text-body text-xs">Set your target marks and track your actual scores for each exam.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Mid 1', targetKey: 'mid1_target', actualKey: 'mid1_actual', total: 30 },
                    { label: 'Mid 2', targetKey: 'mid2_target', actualKey: 'mid2_actual', total: 30 },
                    { label: 'Semester', targetKey: 'sem_target', actualKey: 'sem_actual', total: 100 },
                  ].map(exam => {
                    const actual = targetMarks?.[exam.actualKey] || 0;
                    const target = targetMarks?.[exam.targetKey] || 0;
                    const pct = Math.round((actual / exam.total) * 100);
                    return (
                      <div key={exam.label} className="glass-card rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-header font-bold">{exam.label}</p>
                          <span className="text-xs text-body">/ {exam.total}</span>
                        </div>
                        
                        {/* Progress Ring */}
                        <div className="flex justify-center">
                          <div className="relative w-20 h-20">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="5" />
                              <circle cx="32" cy="32" r="26" fill="none" stroke="#38bdf8" strokeWidth="5"
                                strokeDasharray="163" strokeDashoffset={163 * (1 - pct / 100)} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-lg font-bold text-cyan-400">{actual}</span>
                              <span className="text-[10px] text-body">{pct}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-body uppercase tracking-wider">Target</label>
                            <input
                              type="number" min="0" max={exam.total}
                              defaultValue={target}
                              onBlur={e => handleSaveTargetMarks(exam.targetKey, e.target.value)}
                              className="glass-input w-full rounded-lg p-1.5 text-sm text-center mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-body uppercase tracking-wider">Actual</label>
                            <input
                              type="number" min="0" max={exam.total}
                              defaultValue={actual}
                              onBlur={e => handleSaveTargetMarks(exam.actualKey, e.target.value)}
                              className="glass-input w-full rounded-lg p-1.5 text-sm text-center mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Evidence upload */}
              <div className="glass rounded-2xl p-4 space-y-3">
                <h3 className="text-header font-bold flex items-center gap-2">📸 Answer Paper Evidence</h3>
                <p className="text-body text-xs">Upload photos of your answer papers for future reference and improvement tracking.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {resources.filter(r => r.type === 'evidence').map(res => (
                    <a key={res.id} href={res.url} target="_blank" rel="noreferrer"
                      className="aspect-square glass-card rounded-xl overflow-hidden flex items-center justify-center">
                      <img src={res.url} alt="Evidence" className="object-cover w-full h-full opacity-80" />
                    </a>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-cyan-400/20 hover:border-cyan-400/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all" style={{background: 'rgba(56,189,248,0.05)'}}>
                    <UploadCloud size={24} className="text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-400 text-center">Upload Paper</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden"
                      onChange={e => handleUpload(e.target.files[0], 'evidence')} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: AI Chat History ── */}
          {activeTab === 'ai' && (
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-header font-bold flex items-center gap-2"><MessageSquare size={16} className="text-cyan-400" /> AI Chat History</h3>
                <button onClick={handleSaveAIChat} className="glass-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Plus size={12} /> SAVE CHAT
                </button>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {chats.length === 0 && <p className="text-body text-sm">No AI chats saved. Click + SAVE CHAT to log one.</p>}
                {chats.map(chat => (
                  <div key={chat.id} className="glass-card rounded-xl p-4 space-y-2">
                    <p className="text-header font-semibold text-sm">Q: {chat.query}</p>
                    <div className="h-px" style={{background: 'rgba(56,189,248,0.1)'}} />
                    <p className="text-body text-xs leading-relaxed whitespace-pre-wrap">{chat.response || '—'}</p>
                    <p className="text-cyan-400/50 text-[10px]">{new Date(chat.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
