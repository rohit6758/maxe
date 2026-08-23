import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { PlayCircle, FileText, MessageSquare, Plus, Link as LinkIcon, UploadCloud, Video } from 'lucide-react';

export default function Aggregator() {
  const { session, activeSemester, setActiveSemester, activeSubject, setActiveSubject } = useAppContext();
  
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [chats, setChats] = useState([]);
  
  const [showAddResource, setShowAddResource] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', url: '', type: 'link' });

  useEffect(() => {
    if (session) fetchSemesters();
  }, [session]);

  useEffect(() => {
    if (activeSemester) fetchSubjects();
  }, [activeSemester]);

  useEffect(() => {
    if (activeSubject) {
      fetchResources();
      fetchChats();
    }
  }, [activeSubject]);

  const fetchSemesters = async () => {
    const { data } = await supabase.from('semesters').select('*').eq('user_id', session.user.id);
    setSemesters(data || []);
    if (data && data.length > 0 && !activeSemester) setActiveSemester(data[0].id);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').eq('semester_id', activeSemester);
    setSubjects(data || []);
    if (data && data.length > 0 && !activeSubject) setActiveSubject(data[0].id);
    else if (!data || data.length === 0) setActiveSubject(null);
  };

  const fetchResources = async () => {
    const { data } = await supabase.from('resources').select('*').eq('subject_id', activeSubject);
    setResources(data || []);
  };

  const fetchChats = async () => {
    const { data } = await supabase.from('chat_history').select('*').eq('subject_id', activeSubject);
    setChats(data || []);
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!newResource.title || !newResource.url || !activeSubject) return;

    // determine type
    let type = newResource.type;
    if (newResource.url.includes('youtube.com') || newResource.url.includes('youtu.be')) type = 'youtube';

    const { data, error } = await supabase.from('resources').insert([{
      subject_id: activeSubject,
      title: newResource.title,
      url: newResource.url,
      type
    }]).select();

    if (data) {
      setResources([...resources, data[0]]);
      setShowAddResource(false);
      setNewResource({ title: '', url: '', type: 'link' });
    }
  };

  const handleCreateSemester = async () => {
    const name = prompt('Enter Semester Name (e.g., Semester 1):');
    if (!name) return;
    const { data } = await supabase.from('semesters').insert([{ user_id: session.user.id, name }]).select();
    if (data) {
      setSemesters([...semesters, data[0]]);
      setActiveSemester(data[0].id);
    }
  };

  const handleCreateSubject = async () => {
    if (!activeSemester) {
      alert('Please select a semester first.');
      return;
    }
    const name = prompt('Enter Subject Name (e.g., Data Structures):');
    if (!name) return;
    const { data } = await supabase.from('subjects').insert([{ semester_id: activeSemester, name }]).select();
    if (data) {
      setSubjects([...subjects, data[0]]);
      setActiveSubject(data[0].id);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 md:pb-8 relative">
      
      {/* Context Selectors */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-1 gap-2">
          <select 
            className="bg-surface border border-[#1e293b] text-header rounded-xl p-2 text-sm focus:outline-none focus:border-primary flex-1"
            value={activeSemester || ''}
            onChange={e => setActiveSemester(e.target.value)}
          >
            <option value="" disabled>Select Semester</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={handleCreateSemester} className="bg-primary/20 text-primary border border-primary/50 px-3 rounded-xl text-sm font-bold hover:bg-primary/30">+</button>
        </div>
        
        <div className="flex flex-1 gap-2">
          <select 
            className="bg-surface border border-[#1e293b] text-header rounded-xl p-2 text-sm focus:outline-none focus:border-primary flex-1"
            value={activeSubject || ''}
            onChange={e => setActiveSubject(e.target.value)}
            disabled={!activeSemester}
          >
            <option value="" disabled>Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={handleCreateSubject} disabled={!activeSemester} className="bg-primary/20 text-primary border border-primary/50 px-3 rounded-xl text-sm font-bold hover:bg-primary/30 disabled:opacity-50">+</button>
        </div>
      </div>

      {!activeSubject ? (
        <div className="text-center p-8 bg-surface rounded-2xl border border-[#1e293b]">
          <p className="text-body text-sm">Please select or create a Semester and Subject to view resources.</p>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="space-y-2 mt-2">
            <h2 className="text-3xl font-bold text-header text-aberration">
               {subjects.find(s => s.id === activeSubject)?.name || 'Subject'}
            </h2>
            <p className="text-sm text-body leading-relaxed">
              Aggregated learning materials and recent activity for optimal review.
            </p>
          </div>

          {/* Links & Videos */}
          <section>
            <div className="flex justify-between items-end mb-3 border-b border-[#1e293b] pb-1">
              <div className="flex items-center gap-2 text-body">
                <LinkIcon size={16} />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Web & Video Links</h3>
              </div>
              <button onClick={() => setShowAddResource(!showAddResource)} className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                <Plus size={14} /> ADD LINK
              </button>
            </div>

            {showAddResource && (
              <form onSubmit={handleAddResource} className="bg-surface p-4 rounded-xl border border-[#1e293b] mb-4 space-y-3">
                <input 
                  type="text" placeholder="Resource Name" required
                  value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})}
                  className="w-full bg-[#080F1D] border border-[#1e293b] text-header rounded-lg p-2 text-sm"
                />
                <input 
                  type="url" placeholder="https://..." required
                  value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})}
                  className="w-full bg-[#080F1D] border border-[#1e293b] text-header rounded-lg p-2 text-sm"
                />
                <button type="submit" className="w-full bg-primary/20 text-primary border border-primary/50 py-2 rounded-lg text-sm font-bold">Save Link</button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {resources.filter(r => r.type === 'link' || r.type === 'youtube').length === 0 && <p className="text-xs text-body">No links added.</p>}
              {resources.filter(r => r.type === 'link' || r.type === 'youtube').map(res => (
                <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="bg-surface rounded-xl p-3 flex items-center gap-3 border border-[#1e293b] hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 rounded bg-[#080F1D] flex items-center justify-center border border-[#1e293b]">
                    {res.type === 'youtube' ? <Video size={20} className="text-red-400" /> : <LinkIcon size={20} className="text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-header font-medium text-sm truncate">{res.title}</h4>
                    <p className="text-body text-xs mt-0.5 truncate">{res.url}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* PDF Notes */}
          <section>
            <div className="flex justify-between items-end mb-3 border-b border-[#1e293b] pb-1">
              <div className="flex items-center gap-2 text-body">
                <FileText size={16} />
                <h3 className="text-sm font-semibold uppercase tracking-wider">PDF Notes</h3>
              </div>
              <label className="text-primary text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer">
                <UploadCloud size={14} /> UPLOAD
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file || !activeSubject) return;
                    
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${session.user.id}/${fileName}`;
                    
                    const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);
                    if (uploadError) {
                      alert('Error uploading file: ' + uploadError.message);
                      return;
                    }
                    
                    const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
                    
                    const { data: inserted, error: insertError } = await supabase.from('resources').insert([{
                      subject_id: activeSubject,
                      title: file.name,
                      url: data.publicUrl,
                      type: 'pdf',
                      size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
                    }]).select();
                    
                    if (inserted) {
                      setResources([...resources, inserted[0]]);
                    }
                  }}
                />
              </label>
            </div>
            
            <div className="space-y-2">
              {resources.filter(r => r.type === 'pdf').length === 0 && <p className="text-xs text-body">No PDFs uploaded.</p>}
              {resources.filter(r => r.type === 'pdf').map(res => (
                <div key={res.id} className="bg-surface rounded-xl p-3 flex items-center gap-4 border border-[#1e293b]">
                  <div className="w-10 h-10 rounded bg-[#080F1D] flex items-center justify-center border border-[#1e293b]">
                    <FileText size={20} className="text-body" />
                  </div>
                  <div>
                    <h4 className="text-header font-medium text-sm">{res.title}</h4>
                    <p className="text-body text-xs mt-0.5">{new Date(res.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          {/* AI Chat History */}
          <section>
            <div className="bg-surface rounded-xl border border-[#1e293b] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#1e293b]">
                <div className="flex items-center gap-2 text-header font-semibold">
                  <MessageSquare size={18} className="text-primary" />
                  <h3>AI Chat History</h3>
                </div>
                <button 
                  onClick={async () => {
                    const query = prompt('What was your question to the AI?');
                    if (!query) return;
                    const response = prompt('What was the AI\'s answer? (You can paste it here)');
                    if (!response) return;
                    
                    const { data } = await supabase.from('chats').insert([{
                      subject_id: activeSubject,
                      query,
                      response
                    }]).select();
                    
                    if (data) setChats([data[0], ...chats]);
                  }}
                  className="text-primary text-xs font-bold bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  + Save AI Chat
                </button>
              </div>
              <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                {chats.length === 0 && <p className="text-xs text-body">No chat history for this subject.</p>}
                {chats.map(chat => (
                  <div key={chat.id} className="space-y-2 bg-[#080F1D] p-3 rounded-lg border border-[#1e293b]">
                    <p className="text-header text-sm font-semibold border-b border-[#1e293b] pb-2">"{chat.query}"</p>
                    <p className="text-body text-xs leading-relaxed whitespace-pre-wrap">{chat.response || 'No response recorded.'}</p>
                    <p className="text-primary text-[10px] font-medium pt-2">{new Date(chat.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
