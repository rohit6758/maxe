const fs = require('fs');

function replaceColors(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace specific hardcoded colors with Tailwind classes
  content = content.replace(/style=\{\{background: '#EDF4F0'\}\}/g, 'className="bg-background flex min-h-screen"');
  content = content.replace(/style=\{\{background: '#F7FBF9', borderRight: '1px solid rgba\\(107,168,152,0\\.18\\)'\}\}/g, 'className="hidden md:block w-60 shrink-0 sticky top-0 h-screen bg-surface border-r border-primary/20"');
  content = content.replace(/style=\{\{background: '#F7FBF9'\}\}/g, 'className="bg-surface"');
  content = content.replace(/style=\{\{background: 'rgba\\(45,74,62,0\\.3\\)', backdropFilter: 'blur\\(4px\\)'\}\}/g, 'className="fixed inset-0 z-40 md:hidden bg-header/30 backdrop-blur-sm"');
  content = content.replace(/style=\{\{background: '#F7FBF9', borderBottom: '1px solid rgba\\(107,168,152,0\\.15\\)'\}\}/g, 'className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface border-b border-primary/15"');
  content = content.replace(/style=\{\{background: 'rgba\\(107,168,152,0\\.15\\)', border: '1\\.5px solid rgba\\(107,168,152,0\\.3\\)'\}\}/g, 'className="w-8 h-8 ml-1 rounded-full overflow-hidden flex items-center justify-center bg-primary/15 border-[1.5px] border-primary/30"');
  content = content.replace(/style=\{\{background: 'rgba\\(107,168,152,0\\.15\\)', border: '2px solid rgba\\(107,168,152,0\\.3\\)'\}\}/g, 'className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-primary/15 border-2 border-primary/30"');
  content = content.replace(/style=\{\{background: '#FFFFFF', borderTop: '1px solid rgba\\(107,168,152,0\\.15\\)'\}\}/g, 'className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center h-[56px] px-2 z-30 bg-surface border-t border-primary/15"');
  
  content = content.replace(/style=\{\{borderColor: 'rgba\\(107,168,152,0\\.15\\)'\}\}/g, 'className="border-primary/15"');
  content = content.replace(/style=\{\{borderColor: 'rgba\\(107,168,152,0\\.3\\)', background: 'rgba\\(107,168,152,0\\.1\\)'\}\}/g, 'className="border-primary/30 bg-primary/10"');
  
  content = content.replace(/style=\{\{color: '#2D4A3E'\}\}/g, 'className="text-header"');
  content = content.replace(/style=\{\{color: '#6BA898'\}\}/g, 'className="text-primary"');
  content = content.replace(/style=\{\{color: '#5E7A6E'\}\}/g, 'className="text-body"');
  
  content = content.replace(/style=\{\{color:'#2D4A3E'\}\}/g, 'className="text-header"');
  content = content.replace(/style=\{\{color:'#6BA898'\}\}/g, 'className="text-primary"');
  content = content.replace(/style=\{\{color:'#5E7A6E'\}\}/g, 'className="text-body"');
  
  content = content.replace(/style=\{\{background: '#EAF4EF', color: '#2D4A3E', border: '1px solid rgba\\(107,168,152,0\\.2\\)'\}\}/g, 'className="bg-primary/10 text-header border border-primary/20"');
  
  fs.writeFileSync(file, content);
}

replaceColors('src/Layout.jsx');
replaceColors('src/screens/Profile.jsx');
