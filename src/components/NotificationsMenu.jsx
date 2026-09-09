import React, { useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications, NOTIF_META, timeAgo } from '../context/NotificationsContext';

export default function NotificationsMenu() {
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Group by date
  const today    = new Date().toDateString();
  const yesterday= new Date(Date.now() - 86400000).toDateString();

  const grouped = notifications.reduce((acc, n) => {
    const d = new Date(n.created_at).toDateString();
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
    if (!acc[label]) acc[label] = [];
    acc[label].push(n);
    return acc;
  }, {});

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-10 h-10 rounded-full flex items-center justify-center relative transition-all active:scale-95"
        style={{ background: 'color-mix(in srgb, var(--theme-primary) 10%, var(--theme-surface))' }}
      >
        <Bell size={19} style={{ color: 'var(--theme-primary)' }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full flex items-center justify-center font-black border-2 border-surface"
            style={{ fontSize: '9px', lineHeight: 1 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Panel */}
          <div
            className="absolute top-12 right-0 z-50 flex flex-col overflow-hidden rounded-2xl border shadow-2xl animate-fade-in"
            style={{
              width: 'min(360px, calc(100vw - 24px))',
              maxHeight: '520px',
              background: 'var(--theme-surface)',
              borderColor: 'color-mix(in srgb, var(--theme-ring) 60%, transparent)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{
                borderColor: 'color-mix(in srgb, var(--theme-ring) 40%, transparent)',
                background: 'var(--theme-background)',
              }}
            >
              <div className="flex items-center gap-2">
                <Bell size={15} style={{ color: 'var(--theme-primary)' }} />
                <span className="font-bold text-sm" style={{ color: 'var(--theme-header)' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--theme-primary)' }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg transition-colors hover:opacity-80"
                  style={{ color: 'var(--theme-primary)', background: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' }}
                >
                  <Check size={10} /> Mark all read
                </button>
              )}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' }}>
                    <Bell size={28} style={{ color: 'var(--theme-primary)', opacity: 0.4 }} />
                  </div>
                  <p className="font-bold text-sm" style={{ color: 'var(--theme-header)' }}>All caught up!</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--theme-body)', opacity: 0.6 }}>
                    Follows, community posts, and exam reminders will appear here.
                  </p>
                </div>
              ) : (
                Object.entries(grouped).map(([label, items]) => (
                  <div key={label}>
                    {/* Date label */}
                    <div className="px-4 py-2 sticky top-0 z-10" style={{ background: 'color-mix(in srgb, var(--theme-background) 95%, transparent)' }}>
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--theme-body)', opacity: 0.5 }}>{label}</p>
                    </div>

                    {items.map(notif => {
                      const meta = NOTIF_META[notif.type] || NOTIF_META.default;
                      const Icon = meta.icon;
                      return (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all group relative"
                          style={{
                            background: notif.is_read
                              ? 'transparent'
                              : `color-mix(in srgb, ${meta.color} 5%, var(--theme-surface))`,
                            borderLeft: notif.is_read ? '3px solid transparent' : `3px solid ${meta.color}`,
                          }}
                          onClick={() => !notif.is_read && markRead(notif.id)}
                        >
                          {/* Icon circle */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                            style={{ background: meta.bg }}
                          >
                            <Icon size={18} style={{ color: meta.color }} />
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm leading-snug"
                              style={{ color: notif.is_read ? 'var(--theme-body)' : 'var(--theme-header)', fontWeight: notif.is_read ? 400 : 600 }}
                            >
                              {notif.content}
                            </p>
                            <p className="text-[10px] mt-0.5 font-semibold" style={{ color: meta.color, opacity: notif.is_read ? 0.5 : 1 }}>
                              {meta.label} • {timeAgo(notif.created_at)}
                            </p>
                          </div>

                          {/* Unread dot */}
                          {!notif.is_read && (
                            <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" style={{ background: meta.color }} />
                          )}

                          {/* Dismiss button */}
                          <button
                            onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                            className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          >
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
