import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutGrid, CheckSquare, FileText, Activity, Calendar, User, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from './lib/supabase';
import { useAppContext } from './context/AppContext';
import CalendarModal from './screens/CalendarModal';

export default function Layout() {
  const { userProfile } = useAppContext();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex bg-black min-h-screen">
      
      {/* Desktop Sidebar (Hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-surface border-r border-[#1e293b] flex-col h-screen sticky top-0">
        <div className="p-6 pb-2 border-b border-[#1e293b]">
          <h1 className="text-header font-bold text-xl text-aberration tracking-wide mb-2">Exam Partner</h1>
          <p className="text-xs text-body">Deep Midnight Theme</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <SidebarItem to="/" icon={<LayoutGrid size={20} />} label="Aggregator" />
          <SidebarItem to="/todos" icon={<CheckSquare size={20} />} label="To-Do List" />
          <SidebarItem to="/logs" icon={<FileText size={20} />} label="Logs" />
          <SidebarItem to="/timeline" icon={<Activity size={20} />} label="Timeline" />
        </nav>

        <div className="p-4 border-t border-[#1e293b] space-y-2">
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center gap-3 p-3 w-full rounded-xl text-body hover:bg-primary/10 hover:text-primary transition-colors text-sm font-medium"
          >
            <Calendar size={20} /> Calendar
          </button>
          <Link to="/profile" className="flex items-center gap-3 p-3 w-full rounded-xl text-body hover:bg-primary/10 hover:text-primary transition-colors text-sm font-medium">
            <User size={20} /> {userProfile?.name || 'Profile'}
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full rounded-xl text-body hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-medium">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background relative min-w-0 max-w-full md:max-w-4xl mx-auto shadow-2xl min-h-screen">
        
        {/* Mobile Top App Bar */}
        <header className="md:hidden flex justify-between items-center p-4 border-b border-surface bg-background sticky top-0 z-20">
          <Link to="/profile">
            <div className="w-8 h-8 rounded-full bg-surface border border-primary flex items-center justify-center overflow-hidden">
              {userProfile?.avatar_url ? (
                 <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                 <User className="w-5 h-5 text-primary" />
              )}
            </div>
          </Link>
          <h1 className="text-header font-bold text-lg text-aberration tracking-wide">Exam Partner</h1>
          <button onClick={() => setIsCalendarOpen(true)} className="p-1 text-header hover:text-primary transition">
            <Calendar className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-[80px] md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 w-full max-w-full bg-surface border-t border-[#1e293b] flex justify-around items-center h-[72px] px-2 z-20">
          <NavItem to="/" icon={<LayoutGrid size={24} />} label="Hub" />
          <NavItem to="/todos" icon={<CheckSquare size={24} />} label="To-Do" />
          <NavItem to="/logs" icon={<FileText size={24} />} label="Logs" />
          <NavItem to="/timeline" icon={<Activity size={24} />} label="Timeline" />
        </nav>
      </div>

      {isCalendarOpen && (
        <CalendarModal onClose={() => setIsCalendarOpen(false)} />
      )}
    </div>
  );
}

function SidebarItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 p-3 rounded-xl transition-colors text-sm font-medium",
          isActive ? "bg-primary/20 text-primary border border-primary/30" : "text-body hover:bg-surface hover:text-header border border-transparent"
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex flex-col items-center justify-center w-16 h-full transition-colors",
          isActive ? "text-primary" : "text-body hover:text-header"
        )
      }
    >
      {({ isActive }) => (
        <div className="flex flex-col items-center">
          <div className={clsx("p-1.5 rounded-xl transition-colors", isActive ? "bg-primary/20" : "")}>
             {icon}
          </div>
          <span className="text-[10px] mt-1 font-medium">{label}</span>
        </div>
      )}
    </NavLink>
  );
}
