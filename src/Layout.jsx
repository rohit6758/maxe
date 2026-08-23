import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutGrid, CheckSquare, BookOpen, Calendar, User, LogOut, Download, Menu, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAppContext } from './context/AppContext';
import CalendarModal from './screens/CalendarModal';

export default function Layout() {
  const { userProfile, activeBranch } = useAppContext();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleLogout = async () => supabase.auth.signOut();

  const navLinks = [
    { to: '/', icon: <LayoutGrid size={18} />, label: 'Hub' },
    { to: '/todos', icon: <CheckSquare size={18} />, label: 'To-Do' },
    { to: '/personals', icon: <BookOpen size={18} />, label: 'Personals' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 pb-4 border-b border-sage-100" style={{borderColor: 'rgba(107,168,152,0.15)'}}>
        <h1 className="text-xl font-bold text-aberration" style={{color: '#2D4A3E'}}>Maxe</h1>
        {activeBranch && (
          <span className="text-xs font-semibold mt-1 inline-block tag">{activeBranch}</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 mt-2">
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
      </nav>

      {/* Bottom actions */}
      <div className="p-4 space-y-1 border-t" style={{borderColor: 'rgba(107,168,152,0.15)'}}>
        {installPrompt && (
          <button onClick={handleInstall} className="nav-item w-full font-semibold" style={{color:'#6BA898'}}>
            <Download size={18} /> Install App
          </button>
        )}
        <button onClick={() => { setIsCalendarOpen(true); setSidebarOpen(false); }} className="nav-item w-full">
          <Calendar size={18} /> Calendar
        </button>
        <Link to="/profile" onClick={() => setSidebarOpen(false)} className="nav-item w-full flex">
          <User size={18} />
          <span>{userProfile?.name || 'Profile'}</span>
        </Link>
        <button onClick={handleLogout} className="nav-item w-full" style={{color: '#DC6B6B'}}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{background: '#EDF4F0'}}>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-60 shrink-0 sticky top-0 h-screen" style={{background: '#F7FBF9', borderRight: '1px solid rgba(107,168,152,0.18)'}}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)} style={{background: 'rgba(45,74,62,0.3)', backdropFilter: 'blur(4px)'}}>
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 h-full"
            style={{background: '#F7FBF9'}}
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full md:max-w-3xl mx-auto">

        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3" style={{background: '#F7FBF9', borderBottom: '1px solid rgba(107,168,152,0.15)'}}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl" style={{color: '#5E7A6E'}}>
            <Menu size={22} />
          </button>
          <h1 className="font-bold text-lg text-aberration" style={{color: '#2D4A3E'}}>Maxe</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsCalendarOpen(true)} className="p-2 rounded-xl" style={{color: '#6BA898'}}>
              <Calendar size={20} />
            </button>
            <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{background: 'rgba(107,168,152,0.15)', border: '1.5px solid rgba(107,168,152,0.3)'}}>
              {userProfile?.avatar_url
                ? <img src={userProfile.avatar_url} alt="Me" className="w-full h-full object-cover" />
                : <User size={16} style={{color: '#6BA898'}} />}
            </Link>
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-end px-6 py-4">
          <Link to="/profile" className="flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="text-right">
              <p className="text-sm font-bold text-aberration" style={{color: '#2D4A3E'}}>{userProfile?.name || 'My Profile'}</p>
              <p className="text-xs" style={{color: '#6BA898'}}>{userProfile?.branch || 'Student'}</p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{background: 'rgba(107,168,152,0.15)', border: '2px solid rgba(107,168,152,0.3)'}}>
              {userProfile?.avatar_url
                ? <img src={userProfile.avatar_url} alt="Me" className="w-full h-full object-cover" />
                : <User size={20} style={{color: '#6BA898'}} />}
            </div>
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-[80px] md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 px-4 z-30" style={{background: '#F7FBF9', borderTop: '1px solid rgba(107,168,152,0.15)'}}>
          {[
            { to: '/', icon: <LayoutGrid size={22} />, label: 'Hub' },
            { to: '/todos', icon: <CheckSquare size={22} />, label: 'To-Do' },
            { to: '/personals', icon: <BookOpen size={22} />, label: 'Personals' },
            { to: '/profile', icon: <User size={22} />, label: 'Profile' },
          ].map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 transition-all ${isActive ? '' : 'opacity-50'}`
            }>
              {({ isActive }) => (
                <>
                  <div className="p-1.5 rounded-xl" style={isActive ? {background: 'rgba(107,168,152,0.15)'} : {}}>
                    <span style={{color: isActive ? '#6BA898' : '#5E7A6E'}}>{item.icon}</span>
                  </div>
                  <span className="text-[10px] font-semibold" style={{color: isActive ? '#6BA898' : '#5E7A6E'}}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {isCalendarOpen && <CalendarModal onClose={() => setIsCalendarOpen(false)} />}
    </div>
  );
}
