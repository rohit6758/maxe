import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BookOpen, CalendarDays, MessageCircle, Trash2, UserPlus, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { toast } from '../context/ToastContext';

const notificationTypes = {
  follow: { label: 'New follower', color: 'border-blue-500', icon: UserPlus, iconColor: 'text-blue-500', match: ['follow', 'friend request'] },
  community: { label: 'Community', color: 'border-emerald-500', icon: MessageCircle, iconColor: 'text-emerald-500', match: ['community', 'group'] },
  request: { label: 'Group request', color: 'border-purple-500', icon: UserPlus, iconColor: 'text-purple-500', match: ['request'] },
  calendar: { label: 'Calendar reminder', color: 'border-orange-500', icon: CalendarDays, iconColor: 'text-orange-500', match: ['calendar', 'reminder', 'scheduled'] },
  study: { label: 'Study update', color: 'border-red-500', icon: BookOpen, iconColor: 'text-red-500', match: ['study', 'focus', 'goal'] },
  default: { label: 'Notification', color: 'border-primary', icon: Bell, iconColor: 'text-primary', match: [] }
};

const getNotificationType = (notification) => {
  const explicitType = (notification.type || '').toLowerCase();
  if (notificationTypes[explicitType]) return notificationTypes[explicitType];
  const content = (notification.content || '').toLowerCase();
  return Object.values(notificationTypes).find(type => type.match.some(word => content.includes(word))) || notificationTypes.default;
};

const formatNotificationTime = (createdAt) => {
  const date = new Date(createdAt);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const groupNotifications = (notifications) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const groups = {};
  notifications.forEach(notification => {
    const date = new Date(notification.created_at);
    let label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (date.toDateString() === today.toDateString()) label = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    if (!groups[label]) groups[label] = [];
    groups[label].push(notification);
  });
  return groups;
};

const decodeVapidKey = (value) => {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
};

export default function NotificationsMenu() {
  const { session } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const [pushRegistration, setPushRegistration] = useState('unknown');
  const [banner, setBanner] = useState(null);
  const bannerTimerRef = useRef(null);
  const seenNotificationIdsRef = useRef(new Set());

  const getNotificationSender = async (notification) => {
    if (!notification.actor_id) return null;
    const { data } = await supabase
      .from('profiles')
      .select('name, username, avatar_url')
      .eq('id', notification.actor_id)
      .maybeSingle();
    return data || null;
  };

  const requestPhoneNotifications = async () => {
    if (typeof Notification === 'undefined') {
      toast('Phone notifications are not supported by this browser');
      return;
    }
    try {
      const permission = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
      setNotificationPermission(permission);
      if (permission === 'granted') {
        const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!publicKey) throw new Error('VITE_VAPID_PUBLIC_KEY is missing from this deployment');
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          throw new Error('This browser does not support Web Push');
        }
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        const vapidKeyStorage = 'maxe_push_vapid_public_key';
        const previousPublicKey = window.localStorage.getItem(vapidKeyStorage);
        if (subscription && previousPublicKey !== publicKey) {
          await subscription.unsubscribe();
          subscription = null;
        }
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodeVapidKey(publicKey)
          });
        }
        const p256dh = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');
        if (!p256dh || !auth) throw new Error('Could not read push subscription keys');
        const toBase64 = buffer => btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: session.user.id,
          endpoint: subscription.endpoint,
          p256dh: toBase64(p256dh),
          auth: toBase64(auth),
          updated_at: new Date().toISOString()
        }, { onConflict: 'endpoint' });
        if (error) throw error;
        window.localStorage.setItem(vapidKeyStorage, publicKey);
        setPushRegistration('registered');
        toast('This device is registered for push notifications');
      }
      else if (permission === 'denied') {
        toast('Notifications are blocked. Open browser site settings and allow them.', 'error');
      }
    } catch (error) {
      console.error('Notification permission request failed', error);
      const message = error?.message || 'Unknown registration error';
      toast(`Push registration failed: ${message}`, 'error');
    }
  };

  const showDeviceNotification = async (notification, sender) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const title = sender?.name || (sender?.username ? `@${sender.username}` : getNotificationType(notification).label);
    const community = notification.entity_id
      ? (await supabase.from('communities').select('name, avatar_url').eq('id', notification.entity_id).maybeSingle()).data
      : null;
    const body = `${sender?.username ? `@${sender.username}: ` : ''}${notification.content}${community?.name ? ` · ${community.name}` : ''}`;
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const notificationOptions = {
          body,
          icon: sender?.avatar_url || undefined,
          badge: community?.avatar_url || undefined,
          image: community?.avatar_url || undefined,
          tag: `maxe-${notification.id}`,
          data: { url: notification.url || '/' }
        };
        await registration.showNotification(title, notificationOptions);
      } else {
        new Notification(title, { body, tag: `maxe-${notification.id}` });
      }
    } catch (error) {
      console.error('Device notification display failed', error);
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error && error.code !== 'PGRST205') {
        console.error('Notifications query failed', error);
        toast(`Notifications unavailable: ${error.message}`);
        return;
      }
      if (data) {
        const actorIds = [...new Set(data.map(notification => notification.actor_id).filter(Boolean))];
        let actorMap = {};
        if (actorIds.length > 0) {
          const { data: actors } = await supabase
            .from('profiles')
            .select('id, name, username')
            .in('id', actorIds);
          actorMap = Object.fromEntries((actors || []).map(actor => [actor.id, actor]));
        }
        const enrichedData = data.map(notification => ({
          ...notification,
          actor_name: actorMap[notification.actor_id]?.name,
          actor_username: actorMap[notification.actor_id]?.username
        }));
        const unread = data.filter(n => !n.is_read);
        enrichedData.forEach(notification => seenNotificationIdsRef.current.add(notification.id));
        setNotifications(enrichedData);
        setUnreadCount(unread.length);
      }
    } catch (e) {
      console.error(e);
    }
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    const checkPushRegistration = async () => {
      if (!session || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) setPushRegistration(subscription ? 'registered' : 'unregistered');
      } catch (error) {
        console.error('Could not check push registration', error);
        if (!cancelled) setPushRegistration('unregistered');
      }
    };
    checkPushRegistration();
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    
    // Initial fetch
    fetchNotifications();
    const poll = window.setInterval(fetchNotifications, 3000);
    const refresh = () => { if (document.visibilityState === 'visible') fetchNotifications(); };
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);

    // Register one callback before subscribing. A unique name avoids reusing a
    // channel that React Strict Mode may still be removing.
    const channel = supabase.channel(`my_notifications_${session.user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${session.user.id}`
    }, payload => {
      if (payload.eventType === 'INSERT' && !payload.new.is_read) {
        if (!seenNotificationIdsRef.current.has(payload.new.id)) {
          seenNotificationIdsRef.current.add(payload.new.id);
          setNotifications(prev => prev.some(item => item.id === payload.new.id) ? prev : [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
          getNotificationSender(payload.new).then(sender => {
            const enriched = sender ? { ...payload.new, actor_name: sender.name, actor_username: sender.username } : payload.new;
            setBanner(enriched);
            if (document.visibilityState !== 'visible') {
              showDeviceNotification(payload.new, sender);
            }
          });
          window.clearTimeout(bannerTimerRef.current);
          bannerTimerRef.current = window.setTimeout(() => setBanner(null), 4000);
        }
      } else if (payload.eventType === 'UPDATE') {
        if (payload.new.is_read) {
          setNotifications(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
        } else {
          fetchNotifications();
        }
      } else if (payload.eventType === 'DELETE') {
        setNotifications(prev => prev.filter(item => item.id !== payload.old.id));
      }
    });
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') fetchNotifications();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        fetchNotifications();
      }
    });

    return () => {
      window.clearInterval(poll);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.clearTimeout(bannerTimerRef.current);
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [session, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
      setNotifications(prev => {
        const notification = prev.find(item => item.id === id);
        if (notification && !notification.is_read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.map(n => n.id === id ? { ...n, is_read: true } : n);
      });
    } catch (e) {
      console.error('Failed to mark notification as read', e);
      toast('Could not update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(notification => ({ ...notification, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark notifications as read', e);
      toast('Could not update notifications');
    }
  };

  const deleteNotification = async (id) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Failed to delete notification', error);
      toast('Could not dismiss notification');
      return;
    }
    setNotifications(prev => {
      const removed = prev.find(notification => notification.id === id);
      if (removed && !removed.is_read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(notification => notification.id !== id);
    });
  };

  const groupedNotifications = groupNotifications(notifications);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)} 
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        className="relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-primary/10"
        style={{ color: 'var(--theme-header)' }}
      >
        <Bell size={18} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 text-[9px] font-bold leading-3 text-white"
            style={{ background: 'var(--theme-primary)', borderColor: 'var(--theme-sidebar)' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {banner && (() => {
        const type = getNotificationType(banner);
        const Icon = type.icon;
        return (
          <button
            onClick={() => { setBanner(null); setIsOpen(true); }}
            className="fixed left-1/2 top-4 z-[70] w-[min(92vw,400px)] -translate-x-1/2 rounded-2xl border border-primary/15 bg-surface p-3 text-left shadow-2xl animate-slide-down"
          >
            <span className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon size={16} className={type.iconColor} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[11px] font-bold text-primary">{type.label}</strong>
                <span className="mt-0.5 block truncate text-sm font-bold text-header">
                  {banner.actor_name || (banner.actor_username ? `@${banner.actor_username}` : type.label)}
                </span>
                <span className="block truncate text-xs text-body">{banner.content}</span>
              </span>
              <X size={16} className="text-body shrink-0" />
            </span>
          </button>
        );
      })()}

      {isOpen && (
        <div className="fixed right-3 top-[4.25rem] z-50 flex max-h-[min(70vh,520px)] w-[calc(100vw-24px)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-primary/15 bg-surface shadow-2xl animate-fade-in md:absolute md:right-0 md:top-12 md:max-h-[520px] md:w-80">
          <div className="flex items-center justify-between border-b border-primary/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-header">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="rounded-lg px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/10">
                  <Check size={13} className="mr-1 inline" /> Read all
                </button>
              )}
              <button onClick={() => setIsOpen(false)} aria-label="Close notifications" className="rounded-lg p-1 text-body hover:bg-primary/10">
                <X size={15} />
              </button>
            </div>
          </div>
          {(notificationPermission === 'default' || notificationPermission === 'granted') && pushRegistration !== 'registered' && (
            <button
              onClick={requestPhoneNotifications}
              className="mx-3 mt-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/10"
            >
              {notificationPermission === 'granted' ? 'Register this device for push notifications' : 'Enable phone notifications'}
            </button>
          )}
          {notificationPermission === 'granted' && pushRegistration === 'registered' && (
            <p className="mx-3 mt-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 text-xs font-semibold text-emerald-700">
              This device is registered for push notifications
            </p>
          )}
          {notificationPermission === 'denied' && (
            <p className="mx-3 mt-3 rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-600">
              Notifications are blocked. Allow them in your browser or phone settings.
            </p>
          )}
          
          <div className="min-h-0 flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center text-body">
                <Bell size={26} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">You’re all caught up</p>
                <p className="mt-1 text-xs opacity-70">New activity will appear here.</p>
              </div>
            ) : Object.entries(groupedNotifications).map(([group, items]) => (
              <section key={group} className="border-b border-primary/10 last:border-b-0">
                <h4 className="px-4 pb-1 pt-3 text-[10px] font-black uppercase tracking-wider text-body">{group}</h4>
                <div>
                  {items.map(notif => {
                    const type = getNotificationType(notif);
                    const Icon = type.icon;
                    return (
                      <div key={notif.id} className={`group relative flex gap-3 px-4 py-3 transition-colors hover:bg-primary/10 ${notif.is_read ? 'opacity-65' : 'bg-primary/5'}`}>
                        <button onClick={() => markAsRead(notif.id)} className="flex min-w-0 flex-1 gap-3 text-left">
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notif.is_read ? 'bg-primary/5' : 'bg-primary/10'}`}>
                            <Icon size={15} className={type.iconColor} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-header">
                              {notif.actor_name || (notif.actor_username ? `@${notif.actor_username}` : type.label)}
                            </span>
                            <span className="mt-0.5 block break-words text-xs leading-5 text-body">{notif.content}</span>
                            <span className="mt-1 block text-[10px] text-body">{type.label} · {formatNotificationTime(notif.created_at)}</span>
                          </span>
                        </button>
                        <button onClick={() => deleteNotification(notif.id)} aria-label="Dismiss notification" className="self-start rounded-lg p-1 text-body opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100 focus:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
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
