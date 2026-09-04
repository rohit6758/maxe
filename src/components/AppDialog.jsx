import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * A clean in-app modal that replaces native browser prompt() and confirm().
 * 
 * Props:
 *   type: 'prompt' | 'confirm'
 *   title: string
 *   message: string (optional)
 *   placeholder: string (for prompt type)
 *   confirmText: string (defaults to "OK")
 *   cancelText: string (defaults to "Cancel")
 *   danger: bool — makes confirm button red
 *   onConfirm(value): called with input value (prompt) or undefined (confirm)
 *   onCancel: called when cancelled
 */
export default function AppDialog({ type = 'prompt', title, message, placeholder = '', confirmText = 'OK', cancelText = 'Cancel', danger = false, onConfirm, onCancel }) {
  const [value, setValue] = useState('');

  const handleConfirm = () => {
    if (type === 'prompt' && !value.trim()) return;
    onConfirm(type === 'prompt' ? value.trim() : undefined);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4 border border-primary/10 animate-slide-up">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-black text-header">{title}</h3>
          <button onClick={onCancel} className="text-body/50 hover:text-header shrink-0 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {message && (
          <p className="text-sm text-body">{message}</p>
        )}

        {type === 'prompt' && (
          <input
            autoFocus
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-[#EDF4F0] border border-transparent focus:bg-white focus:border-primary/30 rounded-xl py-2.5 px-4 text-sm outline-none transition-all selectable"
          />
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-primary/15 text-body hover:bg-primary/5 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={type === 'prompt' && !value.trim()}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
