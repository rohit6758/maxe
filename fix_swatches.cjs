const fs = require('fs');
let c = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

const oldSwatches = `                <div>
                  <p className="text-xs font-bold text-header uppercase tracking-wider mb-3">App Theme</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setTheme('default')} className={\`w-10 h-10 rounded-full border-2 \${theme==='default'?'border-primary scale-110':'border-transparent'} bg-[var(--theme-bg)] transition-transform\`} aria-label="Default Mint Theme" title="Default Mint"></button>
                    <button onClick={() => setTheme('eastbay')} className={\`w-10 h-10 rounded-full border-2 \${theme==='eastbay'?'border-[#474C80] scale-110':'border-transparent'} bg-[#F8F7E2] transition-transform flex items-center justify-center\`} aria-label="East Bay Theme" title="East Bay">
                      <div className="w-5 h-5 rounded-full bg-[#474C80]"></div>
                    </button>
                    <button onClick={() => setTheme('dolphin')} className={\`w-10 h-10 rounded-full border-2 \${theme==='dolphin'?'border-[#655A7C] scale-110':'border-transparent'} bg-[#FDF1E2] transition-transform flex items-center justify-center\`} aria-label="Dolphin Theme" title="Dolphin">
                      <div className="w-5 h-5 rounded-full bg-[#655A7C]"></div>
                    </button>
                    <button onClick={() => setTheme('venice')} className={\`w-10 h-10 rounded-full border-2 \${theme==='venice'?'border-[#16587B] scale-110':'border-transparent'} bg-[#F5EEDD] transition-transform flex items-center justify-center\`} aria-label="Venice Blue Theme" title="Venice Blue">
                      <div className="w-5 h-5 rounded-full bg-[#16587B]"></div>
                    </button>
                    <button onClick={() => setTheme('lagoon')} className={\`w-10 h-10 rounded-full border-2 \${theme==='lagoon'?'border-[#008795] scale-110':'border-transparent'} bg-[#F2D4D7] transition-transform flex items-center justify-center\`} aria-label="Lagoon Pulse Theme" title="Lagoon Pulse">
                      <div className="w-5 h-5 rounded-full bg-[#008795]"></div>
                    </button>
                    <button onClick={() => setTheme('berry')} className={\`w-10 h-10 rounded-full border-2 \${theme==='berry'?'border-[#521845] scale-110':'border-transparent'} bg-[#FFD5EA] transition-transform flex items-center justify-center\`} aria-label="Mauve Berry Theme" title="Mauve Berry">
                      <div className="w-5 h-5 rounded-full bg-[#521845]"></div>
                    </button>
                  </div>
                </div>`;

const newSwatches = `                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'var(--theme-header)'}}>App Theme</p>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { id:'default', label:'Mint',    bg:'#D3EDE0', primary:'#1B7A52' },
                      { id:'eastbay', label:'East Bay', bg:'#E5E2CC', primary:'#393EA0' },
                      { id:'dolphin', label:'Dolphin',  bg:'#EDD9C9', primary:'#7A3A9A' },
                      { id:'venice',  label:'Venice',   bg:'#CCDFEE', primary:'#0C5E8A' },
                      { id:'lagoon',  label:'Lagoon',   bg:'#FAC8CC', primary:'#007080' },
                      { id:'berry',   label:'Berry',    bg:'#F3BEE2', primary:'#8A1868' },
                    ].map(t => (
                      <button key={t.id} onClick={() => setTheme(t.id)} title={t.label} aria-label={\`\${t.label} Theme\`}
                        className="relative flex flex-col items-center gap-1">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden flex transition-all duration-200"
                          style={{boxShadow: theme===t.id ? \`0 0 0 3px \${t.primary}, 0 4px 12px \${t.primary}55\` : '0 2px 6px rgba(0,0,0,0.12)', transform: theme===t.id ? 'scale(1.14)' : 'scale(1)'}}>
                          <div className="w-1/2 h-full" style={{background: t.bg}}></div>
                          <div className="w-1/2 h-full" style={{background: t.primary}}></div>
                        </div>
                        <span className="text-[9px] font-bold" style={{color:'var(--theme-body)', opacity:0.7}}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>`;

if (c.includes(oldSwatches)) {
  c = c.replace(oldSwatches, newSwatches);
  fs.writeFileSync('src/screens/Profile.jsx', c);
  console.log('Replaced successfully');
} else {
  console.log('Pattern not found exactly - trying partial match...');
  // Try finding the section by unique string
  const idx = c.indexOf('Default Mint Theme');
  const start = c.lastIndexOf('<div>', idx);
  const endStr = '</div>\n                </div>';
  const end = c.indexOf(endStr, idx) + endStr.length;
  console.log('Found at idx:', idx, 'start:', start, 'end:', end);
  if (idx > 0 && start > 0 && end > 0) {
    c = c.slice(0, start) + newSwatches.slice(newSwatches.indexOf('<div>')) + c.slice(end);
    fs.writeFileSync('src/screens/Profile.jsx', c);
    console.log('Applied via index');
  }
}
