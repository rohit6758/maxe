const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Replace nav-item-active
css = css.replace(/background: rgba\(123,184,168,0\.15\) !important;/g, 'background: color-mix(in srgb, var(--theme-primary) 15%, transparent) !important;');

// Replace nav-item hover
css = css.replace(/background: rgba\(123,184,168,0\.08\);/g, 'background: color-mix(in srgb, var(--theme-primary) 8%, transparent);');

// Replace card background
css = css.replace(/background: #FFFFFF;/g, 'background: var(--theme-surface);');
css = css.replace(/border: 1px solid rgba\(123,184,168,0\.15\);/g, 'border: 1px solid color-mix(in srgb, var(--theme-primary) 15%, transparent);');

// Replace btn-primary
css = css.replace(/background: linear-gradient\(135deg, #8ED0BF, #7BB8A8\);/g, 'background: var(--theme-primary);');
css = css.replace(/background: linear-gradient\(135deg, #8ED0BF, #7BB8A8\) !important;/g, 'background: var(--theme-primary) !important;');
css = css.replace(/color: #FFFFFF;/g, 'color: var(--theme-surface);');
css = css.replace(/background: linear-gradient\(135deg, #9DE0CF, #8ED0BF\);/g, 'background: color-mix(in srgb, var(--theme-primary) 80%, white);');

// Replace tag active
css = css.replace(/background: linear-gradient\(135deg, #8ED0BF, #7BB8A8\);/g, 'background: var(--theme-primary);');
css = css.replace(/color: #FFFFFF;/g, 'color: var(--theme-surface);');

// Replace regular tag
css = css.replace(/background: #F4FAF8;/g, 'background: color-mix(in srgb, var(--theme-bg) 50%, var(--theme-surface));');
css = css.replace(/color: #688C83;/g, 'color: var(--theme-body);');
css = css.replace(/border: 1px solid rgba\(123,184,168,0\.2\);/g, 'border: 1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent);');
css = css.replace(/border: 2px solid rgba\(123,184,168,0\.2\);/g, 'border: 2px solid color-mix(in srgb, var(--theme-primary) 20%, transparent);');

// Replace shadows
css = css.replace(/rgba\(123,184,168,/g, 'color-mix(in srgb, var(--theme-primary) ');
css = css.replace(/rgba\(63,94,86,/g, 'color-mix(in srgb, var(--theme-header) ');
css = css.replace(/0\.4\)/g, '40%, transparent)');
css = css.replace(/0\.3\)/g, '30%, transparent)');
css = css.replace(/0\.2\)/g, '20%, transparent)');
css = css.replace(/0\.15\)/g, '15%, transparent)');
css = css.replace(/0\.12\)/g, '12%, transparent)');
css = css.replace(/0\.1\)/g, '10%, transparent)');
css = css.replace(/0\.08\)/g, '8%, transparent)');
css = css.replace(/0\.04\)/g, '4%, transparent)');
css = css.replace(/0\.03\)/g, '3%, transparent)');
css = css.replace(/0\.02\)/g, '2%, transparent)');

// Other specific colors
css = css.replace(/color: #3F5E56;/g, 'color: var(--theme-header);');
css = css.replace(/color: #5BA390;/g, 'color: var(--theme-primary);');
css = css.replace(/border-color: #7BB8A8;/g, 'border-color: var(--theme-primary);');
css = css.replace(/background: #F0F7F4;/g, 'background: color-mix(in srgb, var(--theme-bg) 70%, var(--theme-surface));');

fs.writeFileSync('src/index.css', css);
