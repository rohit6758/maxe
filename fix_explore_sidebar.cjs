const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

const regex = /<div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">\s*<Layers size=\{20\} className="text-white" \/>\s*<\/div>/g;
const replacement = `<div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden">
                    {comm.avatar_url ? (
                      <img src={comm.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Layers size={20} className="text-white" />
                    )}
                  </div>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/screens/Explore.jsx', content);
