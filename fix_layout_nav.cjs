const fs = require('fs');
let content = fs.readFileSync('src/Layout.jsx', 'utf8');

// Insert into Mobile Top Bar
const mobileTarget = `<button onClick={() => setIsCalendarOpen(true)} className="p-2 rounded-xl" style={{ color: 'var(--theme-primary)' }}>
              <Calendar size={20} />
            </button>
            <Link to="/profile"`;

const mobileReplacement = `<button onClick={() => setIsCalendarOpen(true)} className="p-2 rounded-xl" style={{ color: 'var(--theme-primary)' }}>
              <Calendar size={20} />
            </button>
            <NotificationsMenu />
            <Link to="/profile"`;

content = content.replace(mobileTarget, mobileReplacement);

// Insert into Desktop Top Bar
const desktopTarget = `{/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-end px-6 py-4">
          <Link to="/profile"`;

const desktopReplacement = `{/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-end px-6 py-4 gap-4">
          <NotificationsMenu />
          <Link to="/profile"`;

content = content.replace(desktopTarget, desktopReplacement);

fs.writeFileSync('src/Layout.jsx', content);
