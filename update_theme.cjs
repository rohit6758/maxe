const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Replace @theme variables with CSS custom properties
css = css.replace(/--color-background: #E8F2EE;/g, '--color-background: var(--theme-bg);');
css = css.replace(/--color-surface: #FFFFFF;/g, '--color-surface: var(--theme-surface);');
css = css.replace(/--color-primary: #7BB8A8;/g, '--color-primary: var(--theme-primary);');
css = css.replace(/--color-accent: #A8D1C7;/g, '--color-accent: var(--theme-accent);');
css = css.replace(/--color-header: #3F5E56;/g, '--color-header: var(--theme-header);');
css = css.replace(/--color-body: #688C83;/g, '--color-body: var(--theme-body);');

// Insert root variables
const rootVars = `
:root {
  --theme-bg: #E8F2EE;
  --theme-surface: #FFFFFF;
  --theme-primary: #7BB8A8;
  --theme-accent: #A8D1C7;
  --theme-header: #3F5E56;
  --theme-body: #688C83;
}

[data-theme="midnight"] {
  --theme-bg: #0F172A;
  --theme-surface: #1E293B;
  --theme-primary: #3B82F6;
  --theme-accent: #60A5FA;
  --theme-header: #F8FAFC;
  --theme-body: #94A3B8;
}

[data-theme="crimson"] {
  --theme-bg: #4C0519;
  --theme-surface: #881337;
  --theme-primary: #F43F5E;
  --theme-accent: #FB7185;
  --theme-header: #FFF1F2;
  --theme-body: #FECDD3;
}

[data-theme="amoled"] {
  --theme-bg: #000000;
  --theme-surface: #111111;
  --theme-primary: #10B981;
  --theme-accent: #34D399;
  --theme-header: #FFFFFF;
  --theme-body: #A1A1AA;
}
`;

css = css.replace('@theme {', rootVars + '\n@theme {');
fs.writeFileSync('src/index.css', css);
