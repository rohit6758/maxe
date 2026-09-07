const fs = require('fs');
const glob = require('glob');

const files = [
  ...glob.sync('src/screens/*.jsx'),
  ...glob.sync('src/components/*.jsx')
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('alert(')) {
    content = content.replace(/alert\(/g, "toast(");
    
    // Determine relative path depth
    const depth = file.split('/').length - 2; // src/screens = 2 - 2 = 0? wait, 'src/screens/file.jsx'.split('/') => ['src','screens','file.jsx'] length 3. 3-2 = 1.
    const prefix = file.includes('components') ? '../context/ToastContext' : '../context/ToastContext';
    
    if (!content.includes('import { toast }')) {
      content = `import { toast } from '${prefix}';\n` + content;
    }
    
    fs.writeFileSync(file, content);
    console.log('Patched alerts in', file);
  }
});
