import React, { useState, useEffect } from 'react';

// Simple event emitter for global toasts
class ToastEmitter {
  constructor() {
    this.listeners = [];
  }
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }
  emit(message, type) {
    this.listeners.forEach(fn => fn(message, type));
  }
}

export const toastEmitter = new ToastEmitter();
export const toast = (message, type = 'info') => toastEmitter.emit(message, type);

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastEmitter.subscribe((message, type) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, message, type }]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    });
    return unsubscribe;
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-[90%] max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-fade-in pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-xl border backdrop-blur-md"
          style={{
            backgroundColor: t.type === 'error' ? 'color-mix(in srgb, var(--theme-primary) 10%, #fee2e2)' : 'var(--theme-surface)',
            borderColor: t.type === 'error' ? '#f87171' : 'var(--theme-primary)',
            color: t.type === 'error' ? '#b91c1c' : 'var(--theme-header)'
          }}
        >
          <span className="text-sm font-bold">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="opacity-50 hover:opacity-100 p-1">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
