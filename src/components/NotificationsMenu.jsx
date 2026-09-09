import React, { useState, useEffect, useRef } from 'react';
import { Bell, UserPlus, Users, Calendar, BookOpen, Flame, Check, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';

const NOTIF_ICONS = {
  follow:    { icon: UserPlus,      color: 'text-blue-500',   bg: 'bg-blue-50' },
  community: { icon: MessageSquare, color: 'text-green-600',  bg: 'bg-green-50' },
  request:   { icon: Users,         color: 'text-purple-500', bg: 'bg-purple-50' },
  calendar:  { icon: Calendar,      color: 'text-orange-500', bg: 'bg-orange-50' },
  study:     { icon: Flame,         color: 'text-red-500',    bg: 'bg-red-50' },
  default:   { icon: Bell,          color: 'text-primary',    bg: 'bg-primary/10' },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsMenu() {
  const { session } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!session) return;
    fetchNotifications();

    // Cleanup previous channel
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase.channel(`notifs_${session.user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}`
      }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    channelRef.current = channel;
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error && error.code !== 'PGRST205') { console.error('[Notifications fetch]', error); return; }
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true })
        .eq('user_id', session.user.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const markAsRead = async (id) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-10 h-10 rounded-full flex items-center justify-center relative hover:bg-primary/10 transition-colors"
        style={{ background: 'color-mix(in srgb, var(--theme-surface) 80%, white)' }}
      >
        <Bell size={20} className="text-header" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-surface flex items-center justify-center text-[9px] font-black text-white animate-pulse px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Panel */}
          <div className="absolute top-12 right-0 w-[340px] bg-surface border border-primary/15 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in" style={{ maxHeight: '480px' }}>
            {/* Header */}
            <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-background shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-primary" />
                <h3 className="font-bold text-header text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[10px] uppercase font-bold text-primary hover:underline flex items-center gap-1">
                  <Check size={10} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={28} className="text-body opacity-30 mx-auto mb-3" />
                  <p className="text-body text-sm font-medium">No notifications yet</p>
                  <p className="text-body text-xs opacity-60 mt-1">You'll see follows, posts, calendar reminders here</p>
                </div>
              ) : notifications.map(notif => {
                const kind = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
                const Icon = kind.icon;
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex gap-3 items-start group ${
                      notif.is_read
                        ? 'hover:bg-background/60'
                        : 'bg-primary/5 border border-primary/10 hover:bg-primary/10'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${kind.bg}`}>
                      <Icon size={16} className={kind.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${notif.is_read ? 'text-body' : 'text-header font-semibold'}`}>
                        {notif.content}
                      </p>
                      <p className="text-[10px] text-body/60 mt-0.5">{timeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
