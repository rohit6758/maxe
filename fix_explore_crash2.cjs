const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

// I will use regex to remove the second declaration
const regex1 = /const isCurrentMember = [^\n]+;\n/;
const regex2 = /const isCommunityAdmin = [^\n]+;\n/;

// But wait, there are TWO now. The first one is at the top, the second is around line 517.
// Let's manually replace the ones after line 200.
const lines = content.split('\n');
const newLines = [];
let foundFirst1 = false;
let foundFirst2 = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const isCurrentMember = ')) {
    if (!foundFirst1) {
      foundFirst1 = true;
      newLines.push(lines[i]);
    }
  } else if (lines[i].includes('const isCommunityAdmin = ')) {
    if (!foundFirst2) {
      foundFirst2 = true;
      newLines.push(lines[i]);
    }
  } else {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('src/screens/Explore.jsx', newLines.join('\n'));
