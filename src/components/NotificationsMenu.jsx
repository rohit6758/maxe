import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { toast } from '../context/ToastContext';

export default function NotificationsMenu() {
  const { session } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error && error.code !== 'PGRST205') throw error;
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (e) {
      console.error(e);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    
    // Initial fetch
    fetchNotifications();

    // Realtime subscription
    const channel = supabase.channel(`my_notifications_${session.user.id}`);
    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${session.user.id}` 
      }, payload => {
        setNotifications(prev => prev.some(item => item.id === payload.new.id) ? prev : [payload.new, ...prev]);
        setUnreadCount(prev => prev + (payload.new.is_read ? 0 : 1));
        toast('New notification received!');
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}`
      }, payload => {
        setNotifications(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
        fetchNotifications();
      });
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification as read', e);
      toast('Could not update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark notifications as read', e);
      toast('Could not update notifications');
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface relative hover:bg-primary/10 transition-colors"
      >
        <Bell size={16} strokeWidth={2.25} className="text-header" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-surface border border-primary/20 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[400px] animate-fade-in">
          <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-background">
            <h3 className="font-bold text-header">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[10px] uppercase font-bold text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-body text-sm font-medium">
                No notifications yet
              </div>
            ) : notifications.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => !notif.is_read && markAsRead(notif.id)}
                className={`p-3 rounded-xl cursor-pointer transition-colors flex gap-3 ${notif.is_read ? 'bg-transparent hover:bg-background' : 'bg-primary/5 border border-primary/10'}`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bell size={14} className="text-primary" />
                </div>
                <div>
                  <p className={`text-sm ${notif.is_read ? 'text-body' : 'text-header font-bold'}`}>
                    {notif.content}
                  </p>
                  <p className="text-[10px] text-body mt-1">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Click outside overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
