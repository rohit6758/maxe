import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { toast } from './context/ToastContext';
import { supabase } from './lib/supabase';
import { LayoutGrid, CheckSquare, BookOpen, Calendar, User, LogOut, Download, Menu, Users, Search, Flame, ChevronDown, Sparkles } from 'lucide-react';
import { useAppContext } from './context/AppContext';
import CalendarModal from './screens/CalendarModal';
import TodoModal from './screens/TodoModal';
import OnboardingPopup from './components/OnboardingPopup';
import NotificationsMenu from './components/NotificationsMenu';
import AppDialog from './components/AppDialog';
import SwitchAccountModal from './components/SwitchAccountModal';

export default function Layout() {
  const location = useLocation();

  const { userProfile, activeBranch, session } = useAppContext();

  useEffect(() => {
    if (!session?.user?.id) return;
    
    // Request Native OS Notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    let activeChannel;
    let isCancelled = false; // Fixes the async race condition that causes double notifications
    
    // First, fetch the communities the user is a part of to filter notifications
    const setupNotifications = async () => {
      const { data: myMemberships } = await supabase
        .from('community_members')
        .select('community_id, communities(name)')
        .eq('user_id', session.user.id);
        
      if (isCancelled) return;
        
      const myCommunityIds = myMemberships ? myMemberships.map(m => m.community_id) : [];
      const communityNames = myMemberships ? Object.fromEntries(myMemberships.map(m => [m.community_id, m.communities?.name])) : {};
      
      activeChannel = supabase.channel('global_notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, async (payload) => {
          // If the message is from me, don't toast
          let senderName = 'Someone';
          if (payload.new.user_id === session.user.id) { senderName = 'You'; }
          
          // Only toast if I am a member of this community
          if (myCommunityIds.includes(payload.new.community_id)) {
            // Get sender name
            const { data: sender } = await supabase.from('profiles').select('name, avatar_url').eq('id', payload.new.user_id).single();
            if (sender?.name) senderName = sender.name;
            const commName = communityNames[payload.new.community_id] || 'a community';
            
            // Get avatars
            const { data: comm } = await supabase.from('communities').select('avatar_url').eq('id', payload.new.community_id).single();
            
            // 1. In-App Toast
            toast(
              `${commName}`, 
              `${senderName}: ${payload.new.text}`, 
              { 
                type: 'message', 
                senderAvatar: sender?.avatar_url, 
                groupAvatar: comm?.avatar_url 
              }
            );
            
            // 2. Native OS Floating Web Notification (like WhatsApp Web/Insta)
            if ('Notification' in window && Notification.permission === 'granted') {
               new Notification(commName, {
                 body: `${senderName}: ${payload.new.text}`,
                 icon: sender?.avatar_url || '/icon-192x192.png',
                 badge: comm?.avatar_url || '/icon-192x192.png'
               });
            }
          }
        })
        .subscribe();
    };
    
    setupNotifications();
    
    return () => {
      isCancelled = true;
      if (activeChannel) supabase.removeChannel(activeChannel);
    };
  }, [session]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const navLinks = [
    { to: '/', icon: <LayoutGrid size={18} />, label: 'Home' },
    { to: '/personals', icon: <BookOpen size={18} />, label: 'Improvements' },
    { to: '/explore', icon: <Users size={18} />, label: 'Community' },
    { to: '/search', icon: <Search size={18} />, label: 'Find' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'var(--theme-sidebar)' }}>
      {/* Brand */}
      <div className="p-6 pb-4 border-b" style={{ borderColor: 'color-mix(in srgb, var(--theme-ring) 50%, transparent)' }}>
        <h1 className="text-xl font-black" style={{ color: 'var(--theme-header)' }}>Maxe</h1>
        {activeBranch && (
          <span className="text-xs font-semibold mt-1 inline-block tag">{activeBranch}</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col p-3 space-y-0.5 mt-2">
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
        {/* Study Tracker right under Find */}
        <NavLink
          to="/study-tracker"
          onClick={() => setSidebarOpen(false)}
          className={`nav-item text-left w-full ${userProfile?.is_premium ? 'text-orange-500' : ''}`}
        >
          <Flame size={18} className={userProfile?.is_premium ? 'animate-pulse' : ''} />
          <span>Study Tracker</span>
        </NavLink>
      </nav>

      {/* Bottom actions */}
      <div className="p-3 space-y-0.5 border-t mt-auto" style={{ borderColor: 'color-mix(in srgb, var(--theme-ring) 50%, transparent)' }}>
        {installPrompt && (
          <button onClick={handleInstall} className="nav-item w-full font-semibold">
            <Download size={18} /> Install App
          </button>
        )}
        <button onClick={() => { setIsTodoOpen(true); setSidebarOpen(false); }} className="nav-item w-full">
          <CheckSquare size={18} /> To-Do List
        </button>
        <button onClick={() => { setIsCalendarOpen(true); setSidebarOpen(false); }} className="nav-item w-full">
          <Calendar size={18} /> Calendar
        </button>
        <Link to="/profile" onClick={() => setSidebarOpen(false)} className="nav-item w-full flex">
          <User size={18} />
          <span>{userProfile?.name || 'Profile'}</span>
        </Link>
        {/* Switch Account — Desktop only (mobile has it in the header) */}
        <button
          onClick={() => { setShowSwitchAccount(true); setSidebarOpen(false); }}
          className="hidden md:flex nav-item w-full"
          style={{ color: 'var(--theme-primary)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
          </svg>
          <span className="truncate">Switch Account</span>
        </button>
        <button onClick={() => setShowLogoutConfirm(true)} className="nav-item w-full text-red-400 hover:text-red-500">
          <LogOut size={18} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh]" style={{ background: 'var(--theme-bg)' }}>
      {userProfile && (!userProfile.username || !userProfile.branch || !userProfile.college) && <OnboardingPopup />}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-[100dvh] overflow-y-auto no-scrollbar" style={{ boxShadow: '1px 0 0 color-mix(in srgb, var(--theme-ring) 50%, transparent)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)} style={{ background: 'rgba(0,0,0,0.35)' }}>
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 h-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="app-shell flex-1 flex flex-col min-w-0 max-w-full md:max-w-3xl mx-auto">

        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--theme-sidebar)', boxShadow: '0 1px 0 color-mix(in srgb, var(--theme-ring) 50%, transparent)' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl shrink-0" style={{ color: 'var(--theme-body)' }}>
            <Menu size={22} />
          </button>
          
          {/* Title / Account Switcher (Instagram Style) */}
          <div className="flex-1 flex justify-center min-w-0">
            {location.pathname === '/profile' && userProfile ? (
              <button 
                onClick={() => setShowSwitchAccount(true)}
                className="flex items-center gap-1 max-w-full px-2 py-1 rounded-lg active:scale-95 transition-transform"
                style={{ color: 'var(--theme-header)' }}
              >
                <span className="font-black text-lg truncate">{userProfile.username || 'Profile'}</span>
                <ChevronDown size={18} strokeWidth={2.5} className="shrink-0" />
              </button>
            ) : (
              <h1 className="font-black text-lg truncate" style={{ color: 'var(--theme-header)' }}>Maxe</h1>
            )}
          </div>

          <div className="flex items-center justify-end gap-1 shrink-0">
            {installPrompt && (
              <button
                onClick={handleInstall}
                aria-label="Install Maxe app"
                className="p-2 rounded-xl"
                style={{ color: 'var(--theme-primary)' }}
              >
                <Download size={20} />
              </button>
            )}
            <button onClick={() => setIsTodoOpen(true)} className="p-2 rounded-xl" style={{ color: 'var(--theme-primary)' }}>
              <CheckSquare size={20} />
            </button>
            <button onClick={() => setIsCalendarOpen(true)} className="p-2 rounded-xl" style={{ color: 'var(--theme-primary)' }}>
              <Calendar size={20} />
            </button>
            <NotificationsMenu />
            <Link to="/profile" className="w-8 h-8 ml-1 rounded-full overflow-hidden flex items-center justify-center border-2"
              style={{ borderColor: 'var(--theme-ring)', background: 'color-mix(in srgb, var(--theme-sidebar) 80%, white)' }}>
              {userProfile?.avatar_url
                ? <img src={userProfile.avatar_url} alt="Me" className="w-full h-full object-cover" />
                : <User size={16} style={{ color: 'var(--theme-primary)' }} />}
            </Link>
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-end px-6 py-4 gap-4">
          <NotificationsMenu />
          <Link to="/profile" className="flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: 'var(--theme-header)' }}>{userProfile?.name || 'My Profile'}</p>
              <p className="text-xs" style={{ color: 'var(--theme-primary)' }}>{userProfile?.branch || 'Student'}</p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2"
              style={{ borderColor: 'var(--theme-ring)', background: 'color-mix(in srgb, var(--theme-sidebar) 80%, white)' }}>
              {userProfile?.avatar_url
                ? <img src={userProfile.avatar_url} alt="Me" className="w-full h-full object-cover" />
                : <User size={20} style={{ color: 'var(--theme-primary)' }} />}
            </div>
          </Link>
        </header>

        <main className="app-content flex-1 p-4 md:p-6 pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-8">
          {/* Offline Banner */}
          {!isOnline && (
            <div className="sticky top-0 z-50 bg-yellow-500 text-white text-xs font-bold text-center py-1.5 flex items-center justify-center gap-2">
              <span>📶 You are offline — PDFs you've viewed are available. Community needs internet.</span>
            </div>
          )}
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="maxe-mobile-nav md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center min-h-[56px] h-[calc(56px+env(safe-area-inset-bottom))] px-2 pb-[env(safe-area-inset-bottom)] z-30"
          style={{ background: 'var(--theme-sidebar)', boxShadow: '0 -1px 0 color-mix(in srgb, var(--theme-ring) 50%, transparent)' }}>
          {[
            { to: '/', icon: <LayoutGrid size={22} strokeWidth={2.5} />, label: 'Home' },
            { to: '/explore', icon: <Users size={22} strokeWidth={2.5} />, label: 'Community' },
            { to: '/search', icon: <Search size={22} strokeWidth={2.5} />, label: 'Search' },
            { to: '/personals', icon: <BookOpen size={22} strokeWidth={2.5} />, label: 'Improve' },
            { to: '/profile', icon: <User size={22} strokeWidth={2.5} />, label: 'Profile' },
          ].map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) =>
              `flex flex-col items-center justify-center w-12 h-full transition-all`
            }
              style={({ isActive }) => ({ color: isActive ? 'var(--theme-primary)' : 'var(--theme-body)', opacity: isActive ? 1 : 0.55, transform: isActive ? 'scale(1.15)' : 'scale(1)' })}
            >
              {({ isActive }) => (
                <>
                  <span>{item.icon}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {isCalendarOpen && <CalendarModal onClose={() => setIsCalendarOpen(false)} />}
      {isTodoOpen && <TodoModal onClose={() => setIsTodoOpen(false)} />}
      {showLogoutConfirm && (
        <AppDialog
          type="confirm"
          title="Log out of Maxe?"
          message="You can sign back in anytime."
          confirmText="Log out"
          cancelText="Stay signed in"
          danger
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
      {showSwitchAccount && <SwitchAccountModal onClose={() => setShowSwitchAccount(false)} />}
    </div>
  );
}
