import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { FileText, MessageSquare, Link as LinkIcon, UploadCloud, Video, Plus, ClipboardList, Trash2, X } from 'lucide-react';

const BRANCHES = ['CSE', 'CSM', 'IT', 'CSC', 'EEE', 'MECH', 'CIVIL', 'ECE'];

export default function Aggregator() {
  const { session, activeBranch, setActiveBranch, activeSemester, setActiveSemester, activeSubject, setActiveSubject } = useAppContext();

  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [activeTab, setActiveTab] = useState('links');
  
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  
  const [showAddChat, setShowAddChat] = useState(false);
  const [newChat, setNewChat] = useState({ title: '', url: '' });

  useEffect(() => {
    if (session && activeBranch) fetchSemesters();
    else { setSemesters([]); setActiveSemester(null); }
  }, [session, activeBranch]);

  useEffect(() => {
    if (activeSemester) fetchSubjects();
    else { setSubjects([]); setActiveSubject(null); }
  }, [activeSemester]);

  useEffect(() => {
    if (activeSubject) { fetchResources(); }
    else { setResources([]); }
  }, [activeSubject]);

  const fetchSemesters = async () => {
    const { data } = await supabase.from('semesters').select('*').eq('user_id', session.user.id).eq('branch', activeBranch).order('name');
    setSemesters(data || []);
    if (!activeSemester && data?.length) setActiveSemester(data[0].id);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').eq('semester_id', activeSemester).order('name');
    setSubjects(data || []);
    if (!activeSubject && data?.length) setActiveSubject(data[0].id);
    else if (!data?.length) setActiveSubject(null);
  };

  const fetchResources = async () => {
    const { data } = await supabase.from('resources').select('*').eq('subject_id', activeSubject).order('created_at', { ascending: false });
    setResources(data || []);
  };

  const handleCreateSemester = async () => {
    const name = prompt('Enter semester (e.g. 1-1, 2-2):');
    if (!name) return;
    const { data } = await supabase.from('semesters').insert([{ user_id: session.user.id, name, branch: activeBranch }]).select();
    if (data) { setSemesters(p => [...p, data[0]]); setActiveSemester(data[0].id); }
  };

  const handleCreateSubject = async () => {
    if (!activeSemester) { alert('Select a semester first.'); return; }
    const name = prompt('Enter subject name:');
    if (!name) return;
    const { data } = await supabase.from('subjects').insert([{ semester_id: activeSemester, name }]).select();
    if (data) { setSubjects(p => [...p, data[0]]); setActiveSubject(data[0].id); }
  };

  const handleUpload = async (file, type) => {
    if (!file || !activeSubject) return;
    const filePath = `${session.user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('uploads').upload(filePath, file);
    if (error) { alert('Upload failed: ' + error.message); return; }
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
    const { data } = await supabase.from('resources').insert([{
      subject_id: activeSubject, title: file.name, url: urlData.publicUrl, type,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    }]).select();
    if (data) setResources(p => [data[0], ...p]);
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    let type = newLink.url.includes('youtube') || newLink.url.includes('youtu.be') ? 'youtube' : 'link';
    const { data } = await supabase.from('resources').insert([{ subject_id: activeSubject, title: newLink.title, url: newLink.url, type }]).select();
    if (data) { setResources(p => [data[0], ...p]); setShowAddLink(false); setNewLink({ title: '', url: '' }); }
  };

  const handleAddChat = async (e) => {
    e.preventDefault();
    if (!newChat.title || !newChat.url) return;
    const { data, error } = await supabase.from('resources').insert([{ subject_id: activeSubject, title: newChat.title, url: newChat.url, type: 'chat' }]).select();
    if (error) {
      alert('Error saving chat: ' + error.message);
      return;
    }
    if (data) { setResources(p => [data[0], ...p]); setShowAddChat(false); setNewChat({ title: '', url: '' }); }
  };

  const handleDeleteResource = async (id, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!confirm('Delete this item?')) return;
    await supabase.from('resources').delete().eq('id', id);
    setResources(p => p.filter(r => r.id !== id));
  };

  const handleDeleteSemester = async (id) => {
    if (!confirm('Delete this semester and ALL its subjects/resources?')) return;
    await supabase.from('semesters').delete().eq('id', id);
    setSemesters(p => p.filter(s => s.id !== id));
    setActiveSemester(null);
    setActiveSubject(null);
  };

  const handleDeleteSubject = async (id) => {
    if (!confirm('Delete this subject and ALL its resources?')) return;
    await supabase.from('subjects').delete().eq('id', id);
    setSubjects(p => p.filter(s => s.id !== id));
    setActiveSubject(null);
  };

  const subjectName = subjects.find(s => s.id === activeSubject)?.name || '';
  const semName = semesters.find(s => s.id === activeSemester)?.name || '';

  const TABS = [
    { id: 'links', label: 'Links & Videos', icon: <LinkIcon size={13} /> },
    { id: 'notes', label: 'PDF Notes', icon: <FileText size={13} /> },
    { id: 'papers', label: 'Question Papers', icon: <ClipboardList size={13} /> },
    { id: 'ai', label: 'AI Chats', icon: <MessageSquare size={13} /> },
  ];

  return (
    <div className="space-y-4">

      {/* ── Funnel ── */}
      <div className="card p-4 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest" style={{color: 'var(--color-primary)'}}>Select Context</p>

        {/* Branch */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{color: 'var(--color-body)'}}>① Branch</p>
          <div className="flex flex-wrap gap-2">
            {BRANCHES.map(b => (
              <button key={b}
                onClick={() => { setActiveBranch(b); setActiveSemester(null); setActiveSubject(null); }}
                className={activeBranch === b ? 'tag-active' : 'tag'}
              >{b}</button>
            ))}
          </div>
        </div>

        {/* Semester */}
        {activeBranch && (
          <div>
            <div className="flex justify-between items-end mb-2">
              <p className="text-xs font-semibold" style={{color: 'var(--color-body)'}}>② Semester</p>
              {activeSemester && (
                <button onClick={() => handleDeleteSemester(activeSemester)} className="text-[10px] flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity" style={{color:'var(--color-body)'}}>
                  <Trash2 size={10} /> Delete
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <select className="app-input flex-1" value={activeSemester || ''}
                onChange={e => { setActiveSemester(e.target.value); setActiveSubject(null); }}>
                <option value="" disabled>Select semester</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={handleCreateSemester} className="btn-outline px-3 py-2.5 text-lg font-bold">+</button>
            </div>
          </div>
        )}

        {/* Subject */}
        {activeSemester && (
          <div>
            <div className="flex justify-between items-end mb-2">
              <p className="text-xs font-semibold" style={{color: 'var(--color-body)'}}>③ Subject</p>
              {activeSubject && (
                <button onClick={() => handleDeleteSubject(activeSubject)} className="text-[10px] flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity" style={{color:'var(--color-body)'}}>
                  <Trash2 size={10} /> Delete
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <select className="app-input flex-1" value={activeSubject || ''}
                onChange={e => setActiveSubject(e.target.value)}>
                <option value="" disabled>Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={handleCreateSubject} className="btn-outline px-3 py-2.5 text-lg font-bold">+</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Empty states ── */}
      {!activeBranch && (
        <div className="card p-10 text-center">
          <p className="text-3xl mb-3">🎓</p>
          <p className="font-semibold" style={{color:'var(--color-header)'}}>Select your branch above</p>
          <p className="text-sm mt-1" style={{color:'var(--color-primary)'}}>CSE · IT · EEE and more</p>
        </div>
      )}
      {activeBranch && !activeSubject && (
        <div className="card p-10 text-center">
          <p className="text-3xl mb-3">📚</p>
          <p className="font-semibold" style={{color:'var(--color-header)'}}>Pick a subject to load resources</p>
          <p className="text-sm mt-1" style={{color:'var(--color-primary)'}}>{activeSemester ? 'Use the dropdown above' : 'First choose a semester'}</p>
        </div>
      )}

      {/* ── Subject dashboard ── */}
      {activeSubject && (
        <>
          {/* Subject header */}
          <div className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{color:'var(--color-primary)'}}>{activeBranch} · {semName}</p>
                <h2 className="text-xl font-bold mt-0.5" style={{color:'var(--color-header)'}}>{subjectName}</h2>
              </div>
              <div className="text-right text-xs" style={{color:'var(--color-primary)'}}>
                <p>{resources.length} files</p>
                <p className="mt-0.5">{resources.filter(r => r.type === 'chat').length} AI chats</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeTab === t.id ? 'btn-primary' : 'btn-outline'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── Links & Videos ── */}
          {activeTab === 'links' && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold" style={{color:'var(--color-header)'}}>Links & Videos</h3>
                <button onClick={() => setShowAddLink(!showAddLink)} className="btn-outline flex items-center gap-1 text-xs">
                  <Plus size={12} /> Add
                </button>
              </div>
              {showAddLink && (
                <form onSubmit={handleAddLink} className="space-y-2 p-3 rounded-xl" style={{background:'#F5FAF7', border:'1px solid rgba(79, 93, 83,0.2)'}}>
                  <input className="app-input" placeholder="Name" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} required />
                  <input className="app-input" placeholder="https://..." type="url" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} required />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1 py-2 text-xs">Save</button>
                    <button type="button" onClick={() => setShowAddLink(false)} className="btn-outline flex-1 py-2 text-xs">Cancel</button>
                  </div>
                </form>
              )}
              <div className="space-y-2">
                {resources.filter(r => r.type === 'link' || r.type === 'youtube').length === 0 && <p className="text-sm" style={{color:'var(--color-primary)'}}>No links added yet.</p>}
                {resources.filter(r => r.type === 'link' || r.type === 'youtube').map(res => (
                  <div key={res.id} className="card-sm flex items-center p-3 hover:scale-[1.01] transition-transform">
                    <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:'rgba(79, 93, 83,0.12)'}}>
                        {res.type === 'youtube' ? <Video size={18} style={{color:'#E57373'}} /> : <LinkIcon size={18} style={{color:'var(--color-primary)'}} />}
                      </div>
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-sm truncate" style={{color:'var(--color-header)'}}>{res.title}</p>
                        <p className="text-xs truncate mt-0.5" style={{color:'var(--color-primary)'}}>{res.url}</p>
                      </div>
                    </a>
                    <button onClick={(e) => handleDeleteResource(res.id, e)} className="p-2 shrink-0 opacity-50 hover:opacity-100 transition-opacity" style={{color:'#DC6B6B'}}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PDF Notes ── */}
          {activeTab === 'notes' && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold" style={{color:'var(--color-header)'}}>PDF Notes</h3>
                <label className="btn-outline flex items-center gap-1 text-xs cursor-pointer">
                  <UploadCloud size={12} /> Upload
                  <input type="file" accept="application/pdf" className="hidden" onChange={e => handleUpload(e.target.files[0], 'pdf')} />
                </label>
              </div>
              <div className="space-y-2">
                {resources.filter(r => r.type === 'pdf').length === 0 && <p className="text-sm" style={{color:'var(--color-primary)'}}>No PDFs uploaded yet.</p>}
                {resources.filter(r => r.type === 'pdf').map(res => (
                  <div key={res.id} className="card-sm flex items-center gap-2 p-2 pl-3">
                    <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:'rgba(79, 93, 83,0.12)'}}>
                        <FileText size={18} style={{color:'var(--color-primary)'}} />
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-sm truncate" style={{color:'var(--color-header)'}}>{res.title}</p>
                        <p className="text-xs mt-0.5" style={{color:'var(--color-primary)'}}>{res.size} · {new Date(res.created_at).toLocaleDateString()}</p>
                      </div>
                    </a>
                    <button onClick={(e) => handleDeleteResource(res.id, e)} className="p-2 shrink-0 opacity-50 hover:opacity-100 transition-opacity" style={{color:'#DC6B6B'}}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Question Papers ── */}
          {activeTab === 'papers' && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold" style={{color:'var(--color-header)'}}>Question Papers</h3>
                <label className="btn-outline flex items-center gap-1 text-xs cursor-pointer">
                  <UploadCloud size={12} /> Upload
                  <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleUpload(e.target.files[0], 'question_paper')} />
                </label>
              </div>
              <p className="text-xs" style={{color:'var(--color-primary)'}}>Upload previous year / senior question papers.</p>
              <div className="space-y-2">
                {resources.filter(r => r.type === 'question_paper').length === 0 && <p className="text-sm" style={{color:'var(--color-primary)'}}>No question papers yet.</p>}
                {resources.filter(r => r.type === 'question_paper').map(res => (
                  <div key={res.id} className="card-sm flex items-center gap-2 p-2 pl-3">
                    <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:'rgba(79, 93, 83,0.12)'}}>
                        <ClipboardList size={18} style={{color:'var(--color-primary)'}} />
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-sm truncate" style={{color:'var(--color-header)'}}>{res.title}</p>
                        <p className="text-xs mt-0.5" style={{color:'var(--color-primary)'}}>{res.size} · {new Date(res.created_at).toLocaleDateString()}</p>
                      </div>
                    </a>
                    <button onClick={(e) => handleDeleteResource(res.id, e)} className="p-2 shrink-0 opacity-50 hover:opacity-100 transition-opacity" style={{color:'#DC6B6B'}}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI Chat History ── */}
          {activeTab === 'ai' && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold" style={{color:'var(--color-header)'}}>AI Chat History</h3>
                <button onClick={() => setShowAddChat(!showAddChat)} className="btn-outline flex items-center gap-1 text-xs">
                  <Plus size={12} /> Add Link
                </button>
              </div>
              {showAddChat && (
                <form onSubmit={handleAddChat} className="space-y-2 p-3 rounded-xl" style={{background:'#F5FAF7', border:'1px solid rgba(79, 93, 83,0.2)'}}>
                  <input className="app-input" placeholder="Chat Title (e.g. Unit 1 Summary)" value={newChat.title} onChange={e => setNewChat({...newChat, title: e.target.value})} required />
                  <input className="app-input" placeholder="https://chatgpt.com/share/..." type="text" value={newChat.url} onChange={e => setNewChat({...newChat, url: e.target.value})} required />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1 py-2 text-xs">Save</button>
                    <button type="button" onClick={() => setShowAddChat(false)} className="btn-outline flex-1 py-2 text-xs">Cancel</button>
                  </div>
                </form>
              )}
              <div className="space-y-2">
                {resources.filter(r => r.type === 'chat').length === 0 && <p className="text-sm" style={{color:'var(--color-primary)'}}>No AI chats saved. Add a shared link.</p>}
                {resources.filter(r => r.type === 'chat').map(chat => (
                  <div key={chat.id} className="card-sm flex items-center p-3 hover:scale-[1.01] transition-transform">
                    <a href={chat.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:'rgba(79, 93, 83,0.12)'}}>
                        <MessageSquare size={18} style={{color:'var(--color-primary)'}} />
                      </div>
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-sm truncate" style={{color:'var(--color-header)'}}>{chat.title}</p>
                        <p className="text-xs truncate mt-0.5" style={{color:'var(--color-primary)'}}>{chat.url}</p>
                      </div>
                    </a>
                    <button onClick={(e) => handleDeleteResource(chat.id, e)} className="p-2 shrink-0 opacity-50 hover:opacity-100 transition-opacity" style={{color:'#DC6B6B'}}>
                      <Trash2 size={16} />
                    </button>
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
