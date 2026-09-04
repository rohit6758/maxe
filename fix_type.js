import fs from 'fs';
const file = 'src/screens/Aggregator.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/type === 'ai'/g, "type === 'chat'");
content = content.replace(/type: 'ai'/g, "type: 'chat'");
fs.writeFileSync(file, content);
console.log('Replaced all ai with chat.');
