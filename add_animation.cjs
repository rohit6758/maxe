const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Add slide-down animation if not there
if (!css.includes('animate-slide-down')) {
  const slideDown = `
@keyframes slide-down-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-120%); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
.animate-slide-down {
  animation: slide-down-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
`;
  css = css + slideDown;
  fs.writeFileSync('src/index.css', css);
  console.log('Added slide-down animation');
} else {
  console.log('Already exists');
}
