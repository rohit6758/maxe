const fs = require('fs');

let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

// 1. Change the container
content = content.replace(
  '<div className="flex-1 overflow-y-auto p-4 space-y-4">',
  '<div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start content-start">'
);

// 2. Change the post wrapper
content = content.replace(
  /className=\{`flex flex-col \$\{isMine \? 'items-end' : 'items-start'\}`\}/g,
  'className="flex flex-col h-full w-full"'
);

// 3. Change the card width
content = content.replace(
  /className=\{`max-w-\[85%\] md:max-w-\[70%\] card p-3 space-y-2 relative shadow-sm \$\{isMine \? 'bg-\[var\(--theme-bg\)\] border-\[var\(--theme-primary\)\]\/30' : 'bg-surface'\}`\}/g,
  'className={`w-full flex-1 card p-3 space-y-2 relative shadow-sm flex flex-col ${isMine ? \'bg-[var(--theme-bg)] border-[var(--theme-primary)]/30\' : \'bg-surface\'}`}'
);

// 4. Ensure action buttons stay at bottom
content = content.replace(
  '<div className="flex gap-2 pt-1">',
  '<div className="flex gap-2 pt-2 mt-auto">'
);


fs.writeFileSync('src/screens/Explore.jsx', content);
