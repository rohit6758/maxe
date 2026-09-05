const fs = require('fs');
const path = require('path');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getAllFiles('src');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Hex colors
  content = content.replace(/#2D4A3E/g, 'var(--theme-header)');
  content = content.replace(/#3F5E56/g, 'var(--theme-header)');
  content = content.replace(/#6BA898/g, 'var(--theme-primary)');
  content = content.replace(/#7BB8A8/g, 'var(--theme-primary)');
  content = content.replace(/#8ED0BF/g, 'var(--theme-primary)');
  content = content.replace(/#5E7A6E/g, 'var(--theme-body)');
  content = content.replace(/#688C83/g, 'var(--theme-body)');
  content = content.replace(/#EDF4F0/g, 'var(--theme-bg)');
  content = content.replace(/#EAF4EF/g, 'var(--theme-bg)');
  content = content.replace(/#F5FAF7/g, 'var(--theme-surface)');
  content = content.replace(/#F7FBF9/g, 'var(--theme-surface)');
  content = content.replace(/#F4FAF8/g, 'var(--theme-surface)');
  content = content.replace(/#E8F2EE/g, 'var(--theme-surface)');

  // RGBA strings
  content = content.replace(/rgba\(107,168,152,0\.15\)/g, 'color-mix(in srgb, var(--theme-primary) 15%, transparent)');
  content = content.replace(/rgba\(107,168,152,0\.2\)/g, 'color-mix(in srgb, var(--theme-primary) 20%, transparent)');
  content = content.replace(/rgba\(107,168,152,0\.3\)/g, 'color-mix(in srgb, var(--theme-primary) 30%, transparent)');
  content = content.replace(/rgba\(107,168,152,0\.1\)/g, 'color-mix(in srgb, var(--theme-primary) 10%, transparent)');
  
  // Specific tailwind colors that are hardcoded instead of using the custom properties
  // Some places might have `bg-primary` mapped wrongly if we bypassed index.css.
  // Actually tailwind bg-primary should be okay since index.css maps --color-primary to var(--theme-primary) 

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
