const fs = require('fs');
let content = fs.readFileSync('src/Layout.jsx', 'utf8');

// Import NotificationsMenu
if (!content.includes('import NotificationsMenu')) {
  content = content.replace(
    'import OnboardingPopup from \'./components/OnboardingPopup\';',
    'import OnboardingPopup from \'./components/OnboardingPopup\';\nimport NotificationsMenu from \'./components/NotificationsMenu\';'
  );
}

// Mobile Top Bar
const mobileTopBarOld = `<div className="flex items-center gap-1">
              <button onClick={() => setIsTodoOpen(true)} className="p-2 rounded-xl" style={{ color: 'var(--theme-primary)' }}>
                <CheckSquare size={20} />
              </button>
              <button onClick={() => setIsCalendarOpen(true)} className="p-2 rounded-xl" style={{ color: 'var(--theme-primary)' }}>
                <Calendar size={20} />
              </button>
              <Link to="/profile" className="w-8 h-8 ml-1 rounded-full overflow-hidden flex items-center justify-center border-2"`;

const mobileTopBarNew = `<div className="flex items-center gap-1">
              <NotificationsMenu />
              <button onClick={() => setIsTodoOpen(true)} className="p-2 rounded-xl" style={{ color: 'var(--theme-primary)' }}>
                <CheckSquare size={20} />
              </button>
              <button onClick={() => setIsCalendarOpen(true)} className="p-2 rounded-xl" style={{ color: 'var(--theme-primary)' }}>
                <Calendar size={20} />
              </button>
              <Link to="/profile" className="w-8 h-8 ml-1 rounded-full overflow-hidden flex items-center justify-center border-2"`;

content = content.replace(mobileTopBarOld, mobileTopBarNew);

// Desktop Top Bar
const desktopTopBarOld = `<header className="hidden md:flex items-center justify-end px-6 py-4">
            <Link to="/profile" className="flex items-center gap-3 hover:scale-[1.02] transition-transform">`;

const desktopTopBarNew = `<header className="hidden md:flex items-center justify-end px-6 py-4 gap-4">
            <NotificationsMenu />
            <Link to="/profile" className="flex items-center gap-3 hover:scale-[1.02] transition-transform pl-4 border-l border-primary/20">`;

content = content.replace(desktopTopBarOld, desktopTopBarNew);

fs.writeFileSync('src/Layout.jsx', content);
console.log('Patched Layout.jsx');
