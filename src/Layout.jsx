import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, User, LayoutGrid, ScanLine, FileText, Activity } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const location = useLocation();
  const isScanActive = location.pathname === '/scan';

  return (
    <div className="flex justify-center bg-black min-h-screen">
      <div className="w-full max-w-[400px] bg-background min-h-screen flex flex-col relative shadow-2xl overflow-hidden">
        
        {/* Top App Bar (Hide on Scan Screen as per mockup it has its own top bar) */}
        {!isScanActive && (
          <header className="flex justify-between items-center p-4 border-b border-surface">
            <Menu className="w-6 h-6 text-header" />
            <h1 className="text-header font-bold text-lg text-aberration tracking-wide">Exam Partner</h1>
            <div className="w-8 h-8 rounded-full bg-surface border border-primary flex items-center justify-center overflow-hidden">
              <User className="w-5 h-5 text-primary" />
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-[80px]">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-surface border-t border-[#333] flex justify-around items-center h-[72px] px-2">
          <NavItem to="/" icon={<LayoutGrid size={24} />} label="Aggregator" />
          <NavItem to="/scan" icon={<ScanLine size={32} />} label="Scan" isCenter />
          <NavItem to="/logs" icon={<FileText size={24} />} label="Logs" />
          <NavItem to="/timeline" icon={<Activity size={24} />} label="Timeline" />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, isCenter }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex flex-col items-center justify-center w-16 h-full transition-colors",
          isActive ? "text-primary" : "text-body hover:text-header",
          isCenter && isActive && "text-primary" 
        )
      }
    >
      {({ isActive }) => (
        <div className={clsx("flex flex-col items-center", isActive && !isCenter ? "bg-primary/20 px-3 py-1 rounded-2xl" : "")}>
           {isCenter ? (
              <div className={clsx("p-2 rounded-full", isActive ? "bg-primary/20 text-primary" : "text-body")}>
                {icon}
              </div>
           ) : (
              icon
           )}
          <span className="text-[10px] mt-1 font-medium">{label}</span>
        </div>
      )}
    </NavLink>
  );
}
