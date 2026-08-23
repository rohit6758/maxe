import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutGrid, CheckSquare, FileText, Calendar, User, LogOut, Download, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from './lib/supabase';
import { useAppContext } from './context/AppContext';
import CalendarModal from './screens/CalendarModal';

export default function Layout() {
  const { userProfile, activeBranch } = useAppContext();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex min-h-screen" style={{background: 'transparent'}}>
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col h-screen sticky top-0 glass-strong">
        <div className="p-6 pb-4 border-b border-cyan-400/10 flex items-center gap-3">
          <img src="/logo.png" alt="Maxe" className="w-10 h-10 rounded-xl" style={{boxShadow: '0 0 16px rgba(56,189,248,0.4)'}} />
          <div>
            <h1 className="text-header font-bold text-xl text-aberration tracking-wide">Maxe</h1>
            {activeBranch && <p className="text-xs text-cyan-400/70">{activeBranch}</p>}
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 mt-2">
          <SidebarItem to="/" icon={<LayoutGrid size={18} />} label="Hub" />
          <SidebarItem to="/todos" icon={<CheckSquare size={18} />} label="To-Do List" />
          <SidebarItem to="/personals" icon={<BookOpen size={18} />} label="Personals" />
        </nav>

        <div className="p-4 border-t border-cyan-400/10 space-y-1">
          {installPrompt && (
            <button onClick={handleInstallClick} className="flex items-center gap-3 p-3 w-full rounded-xl text-cyan-400 hover:glass-card transition-all text-sm font-bold">
              <Download size={18} /> Install App
            </button>
          )}
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center gap-3 p-3 w-full rounded-xl text-body hover:text-header hover:glass-card transition-all text-sm font-medium"
          >
            <Calendar size={18} /> Calendar
          </button>
          <Link to="/profile" className="flex items-center gap-3 p-3 w-full rounded-xl text-body hover:text-header hover:glass-card transition-all text-sm font-medium">
            <User size={18} /> {userProfile?.name || 'Profile'}
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-w-0 max-w-full md:max-w-4xl mx-auto min-h-screen">
        
        {/* Mobile Top Bar */}
        <header className="md:hidden flex justify-between items-center p-4 sticky top-0 z-20 glass">
          <Link to="/profile">
            <div className="w-9 h-9 rounded-full border border-cyan-400/40 flex items-center justify-center overflow-hidden" style={{background: 'rgba(56,189,248,0.1)'}}>
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-cyan-400" />
              )}
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Maxe" className="w-7 h-7 rounded-lg" />
            <h1 className="text-header font-bold text-lg text-aberration tracking-wide">Maxe</h1>
          </div>
          <div className="flex items-center gap-2">
            {installPrompt && (
              <button onClick={handleInstallClick} className="p-1.5 text-cyan-400">
                <Download className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setIsCalendarOpen(true)} className="p-1.5 text-body hover:text-header transition">
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-[80px] md:pb-8 px-4 md:px-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass flex justify-around items-center h-[68px] px-2 z-20">
          <MobileNavItem to="/" icon={<LayoutGrid size={22} />} label="Hub" />
          <MobileNavItem to="/todos" icon={<CheckSquare size={22} />} label="To-Do" />
          <MobileNavItem to="/personals" icon={<BookOpen size={22} />} label="Personals" />
          <MobileNavItem to="/profile" icon={<User size={22} />} label="Profile" />
        </nav>
      </div>

      {isCalendarOpen && <CalendarModal onClose={() => setIsCalendarOpen(false)} />}
    </div>
  );
}

function SidebarItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium",
          isActive
            ? "glass-card text-cyan-400 border-cyan-400/30"
            : "text-body hover:text-header hover:glass-card"
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function MobileNavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        clsx(
          "flex flex-col items-center justify-center w-16 h-full transition-all gap-0.5",
          isActive ? "text-cyan-400" : "text-body hover:text-header"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className={clsx("p-1.5 rounded-xl transition-all", isActive ? "glass-card" : "")}>
            {icon}
          </div>
          <span className="text-[10px] font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
}
