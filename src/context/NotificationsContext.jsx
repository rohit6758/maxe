import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserPlus, Users, Calendar, MessageSquare, Bell, Flame, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from './AppContext';

// ΓöÇΓöÇΓöÇ icon map ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const NOTIF_META = {
  follow:    { icon: UserPlus,      color: '#3B82F6', bg: '#EFF6FF', label: 'New Follower' },
  community: { icon: MessageSquare, color: '#16A34A', bg: '#F0FDF4', label: 'Community' },
  request:   { icon: Users,         color: '#9333EA', bg: '#FAF5FF', label: 'Join Request' },
  calendar:  { icon: Calendar,      color: '#F97316', bg: '#FFF7ED', label: 'Calendar' },
  study:     { icon: Flame,         color: '#EF4444', bg: '#FEF2F2', label: 'Study' },
  default:   { icon: Bell,          color: 'var(--theme-primary)', bg: 'color-mix(in srgb, var(--theme-primary) 10%, white)', label: 'Notification' },
};

export function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ΓöÇΓöÇΓöÇ context ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const NotifCtx = createContext(null);
export const useNotifications = () => useContext(NotifCtx);

// ΓöÇΓöÇΓöÇ Top Banner (Instagram-style slide-in) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function NotifBanner({ notif, onDismiss }) {
  const meta = NOTIF_META[notif.type] || NOTIF_META.default;
  const Icon = meta.icon;

  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed top-4 left-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border cursor-pointer animate-slide-down max-w-sm w-[calc(100vw-32px)]"
      style={{
        transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        borderColor: 'rgba(0,0,0,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}
      onClick={onDismiss}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
        <Icon size={18} style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate leading-snug">{notif.content}</p>
      </div>
      <button onClick={onDismiss} className="p-1 rounded-full hover:bg-gray-100 shrink-0">
        <X size={14} className="text-gray-400" />
      </button>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Provider ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function NotificationsProvider({ children }) {
  const { session } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [banner, setBanner]             = useState(null);
  const channelRef                      = useRef(null);

  useEffect(() => {
    if (!session) return;
    fetchAll();

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`notifs_${session.user.id}_${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${session.user.id}`,
      }, ({ new: n }) => {
        setNotifications(prev => [n, ...prev]);
        setUnreadCount(prev => prev + 1);
        setBanner(n);   // trigger slide-in banner
      })
      .subscribe();
    channelRef.current = ch;
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [session]);

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from('notifications').select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false }).limit(40);
    if (error) { console.error('[Notifs]', error); return; }
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true })
      .eq('user_id', session.user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const dismiss = async (id) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => {
      const removed = notifications.find(n => n.id === id);
      return removed && !removed.is_read ? Math.max(0, prev - 1) : prev;
    });
  };

  return (
    <NotifCtx.Provider value={{ notifications, unreadCount, markRead, markAllRead, dismiss, refetch: fetchAll }}>
      {children}
      {banner && (
        <NotifBanner notif={banner} onDismiss={() => setBanner(null)} />
      )}
    </NotifCtx.Provider>
  );
}
