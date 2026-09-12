import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, Send, User, FileText, Layers, BrainCircuit, Loader2, ArrowRight, BookOpen, AlertTriangle, Check, Upload } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function AICoach() {
  const { session, userProfile } = useAppContext();
  const [activeTab, setActiveTab] = useState('chat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hello! I am your Maxe AI Coach. How can I help you study today?' }]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const [notesInput, setNotesInput] = useState('');
  const [generateMode, setGenerateMode] = useState('summary');
  const [options, setOptions] = useState({ shorter: false, simpleEnglish: false, examImportant: false });
  const [toolResult, setToolResult] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callAI = async (payload) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) throw new Error('Not logged in');

    const response = await fetch('https://dgveleeduexjklzojkcj.supabase.co/functions/v1/maxe-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      if (data.requiresUpgrade) {
        throw new Error('You have reached your 5 free AI queries. Please upgrade to Pro to continue.');
      }
      throw new Error(data.error || 'Failed to connect to AI');
    }
    return data.result;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);
    setError('');

    try {
      const reply = await callAI({
        action: 'chat',
        text: userMessage,
        context: {
          branch: userProfile?.branch,
          college: userProfile?.college,
          semester: userProfile?.semester
        }
      });
      
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error. ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      setNotesInput(fullText);
    } catch (err) {
      setError('Failed to extract text from PDF: ' + err.message);
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const handleGenerateMaterials = async () => {
    if (!notesInput.trim()) return setError('Please paste some text to process.');
    
    setLoading(true);
    setError('');
    setToolResult(null);

    try {
      const result = await callAI({
        action: 'process_notes',
        text: notesInput,
        options: {
          mode: generateMode,
          ...options
        }
      });
      setToolResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col absolute top-0 left-0 right-0 bottom-16 md:bottom-0" style={{ background: 'var(--theme-bg)' }}>
      <div className="shrink-0 px-4 py-4 border-b flex items-center justify-between" style={{ borderColor: 'color-mix(in srgb, var(--theme-ring) 30%, transparent)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-tr from-primary to-accent text-white shadow-sm">
            <Sparkles size={16} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight" style={{ color: 'var(--theme-header)' }}>Maxe AI</h1>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70" style={{ color: 'var(--theme-primary)' }}>Your personal coach</p>
          </div>
        </div>
        
        <div className="flex bg-white/50 backdrop-blur-sm rounded-lg p-1 border" style={{ borderColor: 'color-mix(in srgb, var(--theme-ring) 30%, transparent)' }}>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'chat' ? 'bg-white shadow-sm text-primary' : 'text-body opacity-70 hover:opacity-100'}`}
          >
            <Bot size={14} /> Chat
          </button>
          <button 
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'tools' ? 'bg-white shadow-sm text-primary' : 'text-body opacity-70 hover:opacity-100'}`}
          >
            <Layers size={14} /> Tools
          </button>
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 rounded-lg flex items-center gap-2 text-sm font-bold bg-red-50 text-red-600">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        
        {activeTab === 'chat' && (
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-primary/10' : 'bg-primary text-white'}`}>
                    {msg.role === 'user' ? <User size={14} className="text-primary" /> : <Bot size={14} />}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white shadow-sm rounded-tl-sm border'}`} style={msg.role !== 'user' ? { borderColor: 'color-mix(in srgb, var(--theme-ring) 30%, transparent)', color: 'var(--theme-body)' } : {}}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-primary text-white">
                    <Bot size={14} />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl text-sm bg-white shadow-sm rounded-tl-sm border flex items-center gap-2 text-body" style={{ borderColor: 'color-mix(in srgb, var(--theme-ring) 30%, transparent)' }}>
                    <Loader2 size={14} className="animate-spin" /> Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="shrink-0 p-4 bg-white/50 backdrop-blur-md border-t" style={{ borderColor: 'color-mix(in srgb, var(--theme-ring) 30%, transparent)' }}>
              <form onSubmit={handleSendMessage} className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={loading}
                  className="w-full bg-white border rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: 'color-mix(in srgb, var(--theme-ring) 50%, transparent)', color: 'var(--theme-body)' }}
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white bg-primary disabled:opacity-50 transition-opacity"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="absolute inset-0 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
              
              <div className="card p-5">
                <h2 className="font-bold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--theme-header)' }}>
                  <FileText size={18} className="text-primary" /> Paste Notes or Text
                </h2>
                <div className="mb-4">
                  <label className="btn-outline inline-flex items-center gap-2 cursor-pointer">
                    <Upload size={14} /> Upload PDF
                    <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={loading} />
                  </label>
                </div>
                <textarea
                  className="app-input w-full min-h-[150px] resize-y text-sm"
                  placeholder="Paste your study material here, and I'll process it for you..."
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                />
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { id: 'summary', label: 'Summary / Notes' },
                    { id: 'flashcards', label: 'Flashcards' },
                    { id: 'quiz', label: 'Multiple Choice Quiz' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setGenerateMode(mode.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-colors border ${generateMode === mode.id ? 'bg-primary text-white border-primary' : 'bg-transparent text-body border-ring/50 hover:border-primary/50'}`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {generateMode === 'summary' && (
                  <div className="mt-4 flex flex-wrap items-center gap-4 py-3 px-4 rounded-xl" style={{ background: 'color-mix(in srgb, var(--theme-sidebar) 50%, transparent)' }}>
                    <label className="flex items-center gap-2 text-xs font-bold text-body cursor-pointer">
                      <input type="checkbox" checked={options.shorter} onChange={e => setOptions(p => ({...p, shorter: e.target.checked}))} className="rounded text-primary focus:ring-primary" />
                      Make it shorter
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-body cursor-pointer">
                      <input type="checkbox" checked={options.simpleEnglish} onChange={e => setOptions(p => ({...p, simpleEnglish: e.target.checked}))} className="rounded text-primary focus:ring-primary" />
                      Simple English
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-body cursor-pointer">
                      <input type="checkbox" checked={options.examImportant} onChange={e => setOptions(p => ({...p, examImportant: e.target.checked}))} className="rounded text-primary focus:ring-primary" />
                      Exam points only
                    </label>
                  </div>
                )}

                <button 
                  onClick={handleGenerateMaterials}
                  disabled={loading || !notesInput.trim()}
                  className="btn-primary w-full mt-4 py-3 font-bold text-sm flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                  {loading ? 'Processing Material...' : 'Generate Material'}
                </button>
              </div>

              {toolResult && (
                <div className="card p-5 animate-slide-up border-2" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--theme-header)' }}>
                    <BookOpen size={18} className="text-primary" /> Results
                  </h3>
                  
                  {generateMode === 'summary' ? (
                    <div className="prose prose-sm max-w-none text-body whitespace-pre-wrap">
                      {typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2)}
                    </div>
                  ) : generateMode === 'flashcards' && Array.isArray(toolResult) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {toolResult.map((card, i) => (
                        <div key={i} className="p-4 rounded-xl border group cursor-pointer transition-colors" style={{ background: 'color-mix(in srgb, var(--theme-sidebar) 30%, transparent)', borderColor: 'color-mix(in srgb, var(--theme-ring) 30%, transparent)' }}>
                          <p className="text-xs font-bold uppercase text-primary mb-2">Front</p>
                          <p className="text-sm font-medium mb-4" style={{ color: 'var(--theme-header)' }}>{card.front}</p>
                          <div className="h-px w-full my-3" style={{ background: 'color-mix(in srgb, var(--theme-ring) 20%, transparent)' }} />
                          <p className="text-xs font-bold uppercase text-primary mb-2">Back</p>
                          <p className="text-sm" style={{ color: 'var(--theme-body)' }}>{card.back}</p>
                        </div>
                      ))}
                    </div>
                  ) : generateMode === 'quiz' && Array.isArray(toolResult) ? (
                    <div className="space-y-6">
                      {toolResult.map((q, i) => (
                        <div key={i} className="p-4 rounded-xl border" style={{ background: 'color-mix(in srgb, var(--theme-sidebar) 30%, transparent)', borderColor: 'color-mix(in srgb, var(--theme-ring) 30%, transparent)' }}>
                          <p className="font-bold text-sm mb-3" style={{ color: 'var(--theme-header)' }}>{i + 1}. {q.question}</p>
                          <div className="space-y-2">
                            {q.options?.map((opt, j) => (
                              <div key={j} className={`px-3 py-2 rounded-lg text-sm border ${opt === q.answer ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-white'}`} style={opt !== q.answer ? { borderColor: 'color-mix(in srgb, var(--theme-ring) 30%, transparent)', color: 'var(--theme-body)' } : {}}>
                                {opt}
                                {opt === q.answer && <Check size={14} className="inline ml-2" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm overflow-auto" style={{ color: 'var(--theme-body)' }}>
                      <pre>{JSON.stringify(toolResult, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
