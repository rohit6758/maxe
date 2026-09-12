import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const listeners = new Set();

export function toast(title, message, options = {}) {
  listeners.forEach(fn => fn(title, message, options));
}

function subscribe(fn) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribe((title, message, options) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, title, message, ...options }]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000); // 5 seconds for rich notifications
    });
    return unsubscribe;
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-[95%] max-w-sm">
      {toasts.map((t) => {
        if (t.type === 'message') {
          return (
            <div key={t.id} className="animate-slide-down pointer-events-auto bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex items-center gap-3 border border-gray-100 overflow-hidden relative">
              {/* Left: Sender Profile Pic */}
              <div className="w-10 h-10 rounded-full shrink-0 bg-gray-200 overflow-hidden">
                {t.senderAvatar ? <img src={t.senderAvatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/20" />}
              </div>
              
              {/* Middle: Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 truncate">{t.title}</p>
                <p className="text-sm font-bold text-gray-900 truncate">{t.message}</p>
              </div>

              {/* Right: Group Profile Pic & M Logo overlay */}
              <div className="w-10 h-10 rounded-xl shrink-0 bg-gray-100 overflow-hidden relative border border-gray-200">
                {t.groupAvatar ? <img src={t.groupAvatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10" />}
                {/* Tiny Maxe M Logo indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary text-white text-[8px] font-black flex items-center justify-center rounded-tl-md">M</div>
              </div>
              
              {/* Close Button overlay (appears on hover) */}
              <button onClick={() => removeToast(t.id)} className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity bg-white/80 rounded-full p-0.5">
                <X size={12} className="text-gray-500" />
              </button>
            </div>
          );
        }

        // Standard Toast
        return (
          <div
            key={t.id}
            className="animate-slide-down pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-xl border backdrop-blur-md"
            style={{
              backgroundColor: t.type === 'error' ? 'color-mix(in srgb, var(--theme-primary) 10%, #fee2e2)' : 'var(--theme-surface)',
              borderColor: t.type === 'error' ? '#f87171' : 'var(--theme-primary)',
              color: t.type === 'error' ? '#b91c1c' : 'var(--theme-header)'
            }}
          >
            <div className="flex flex-col min-w-0 pr-2">
              {t.title && <span className="text-xs font-bold opacity-70">{t.title}</span>}
              <span className="text-sm font-bold truncate">{t.message}</span>
            </div>
            <button onClick={() => removeToast(t.id)} className="opacity-50 hover:opacity-100 p-1 shrink-0">
               <X size={16} /> 
            </button>
          </div>
        );
      })}
    </div>
  );
}