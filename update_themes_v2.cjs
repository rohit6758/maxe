const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const newThemes = `
:root {
  /* Default Mint */
  --theme-bg: #E8F2EE;
  --theme-surface: #FFFFFF;
  --theme-primary: #7BB8A8;
  --theme-accent: #A8D1C7;
  --theme-header: #3F5E56;
  --theme-body: #688C83;
}

[data-theme="eastbay"] {
  --theme-bg: #F8F7E2;
  --theme-surface: #FFFFFF;
  --theme-primary: #474C80;
  --theme-accent: #656C9A;
  --theme-header: #35395A;
  --theme-body: #5C6287;
}

[data-theme="dolphin"] {
  --theme-bg: #FDF1E2;
  --theme-surface: #FFFFFF;
  --theme-primary: #655A7C;
  --theme-accent: #AB92BF;
  --theme-header: #4A425B;
  --theme-body: #786C8F;
}

[data-theme="venice"] {
  --theme-bg: #F5EEDD;
  --theme-surface: #FFFFFF;
  --theme-primary: #16587B;
  --theme-accent: #84B3CE;
  --theme-header: #0E3950;
  --theme-body: #256B91;
}

[data-theme="lagoon"] {
  --theme-bg: #F2D4D7;
  --theme-surface: #FFFFFF;
  --theme-primary: #008795;
  --theme-accent: #F88379;
  --theme-header: #005A63;
  --theme-body: #00A6B5;
}

[data-theme="berry"] {
  --theme-bg: #FFD5EA;
  --theme-surface: #FFFFFF;
  --theme-primary: #521845;
  --theme-accent: #BFD7F1;
  --theme-header: #380C2E;
  --theme-body: #732863;
}
`;

// Replace the existing :root and data-themes
css = css.replace(/:root \{[\s\S]*?\[data-theme="amoled"\] \{[\s\S]*?\}/, newThemes.trim());

fs.writeFileSync('src/index.css', css);
