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
      }, 4000);
    });
    return unsubscribe;
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-[9999] pointer-events-none flex flex-col gap-2">
      {toasts.map((t) => {
        if (t.type === 'message') {
          return (
            <div key={t.id} className="bg-gray-900/95 backdrop-blur text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 transform transition-all duration-300 ease-out animate-slide-down pointer-events-auto w-full">
              {/* Left Side (Sender) */}
              <img src={t.senderAvatar || '/icon-192x192.png'} alt="Sender" className="w-12 h-12 rounded-full object-cover shrink-0" />
              
              {/* Middle (Content) */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-white">{t.title}</p>
                <p className="text-xs text-gray-300 truncate">{t.message}</p>
              </div>

              {/* Right Side (Community Badge) */}
              <img src={t.groupAvatar || '/icon-192x192.png'} alt="Group" className="w-6 h-6 rounded-md object-cover ml-auto shrink-0" />
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