const fs = require('fs');

const NEW_DECORATIONS = `const THEME_DECORATIONS = {
  default: {
    name: 'Dinosaurs',
    bg: 'linear-gradient(135deg, #D3EDE0 0%, #A8D5B2 100%)',
    elements: (
      <>
        {/* T-Rex */}
        <div className="absolute -top-4 -left-2 animate-bounce" style={{animationDuration:'3s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'}}>
          <span style={{fontSize: '24px'}}>🦖</span>
        </div>
        {/* Sauropod */}
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 animate-pulse" style={{animationDuration:'4s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'}}>
          <span style={{fontSize: '22px'}}>🦕</span>
        </div>
        {/* Volcanos / Leaves */}
        <div className="absolute -bottom-3 left-1/4 animate-ping" style={{animationDuration:'3s'}}>
          <span style={{fontSize: '14px'}}>🌋</span>
        </div>
      </>
    )
  },

  eastbay: {
    name: 'Stars',
    bg: 'linear-gradient(135deg, #1C1E50 0%, #35395A 50%, #1C1E50 100%)',
    elements: (
      <>
        {/* Big Star */}
        <div className="absolute -top-5 right-0 animate-spin" style={{animationDuration:'8s', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'}}>
          <span style={{fontSize: '24px'}}>⭐</span>
        </div>
        {/* Sparkles */}
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 animate-pulse" style={{animationDuration:'2s'}}>
          <span style={{fontSize: '20px'}}>✨</span>
        </div>
        {/* Shooting star */}
        <div className="absolute -bottom-4 right-1/4 animate-bounce" style={{animationDuration:'4s'}}>
          <span style={{fontSize: '18px'}}>🌠</span>
        </div>
      </>
    )
  },

  dolphin: {
    name: 'Ocean',
    bg: 'linear-gradient(135deg, #4A425B 0%, #6D4C9A 100%)',
    elements: (
      <>
        {/* Dolphin */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" style={{animationDuration:'3s'}}>
          <span style={{fontSize: '24px'}}>🐬</span>
        </div>
        {/* Shell */}
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 animate-pulse" style={{animationDuration:'4s'}}>
          <span style={{fontSize: '20px'}}>🐚</span>
        </div>
        {/* Wave */}
        <div className="absolute -bottom-2 left-1/4 animate-ping" style={{animationDuration:'2s'}}>
          <span style={{fontSize: '16px'}}>🌊</span>
        </div>
      </>
    )
  },

  venice: {
    name: 'Space',
    bg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    elements: (
      <>
        <div className="absolute -top-6 -right-2 animate-spin" style={{animationDuration:'4s', transformOrigin:'-20px 50px'}}>
          <span style={{fontSize: '22px', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'}}>🚀</span>
        </div>
        <div className="absolute top-1/3 -left-5 animate-pulse" style={{animationDuration:'3s'}}>
          <span style={{fontSize: '22px', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'}}>🪐</span>
        </div>
        <div className="absolute -bottom-4 right-1/4 animate-bounce" style={{animationDuration:'2.5s'}}>
          <span style={{fontSize: '20px', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'}}>🛸</span>
        </div>
      </>
    )
  },

  lagoon: {
    name: 'Cars',
    bg: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
    elements: (
      <>
        {/* Sports Car */}
        <div className="absolute -top-3 -right-4 animate-bounce" style={{animationDuration:'2s'}}>
          <span style={{fontSize: '24px'}}>🏎️</span>
        </div>
        {/* Police Car */}
        <div className="absolute top-1/2 -left-5 -translate-y-1/2 animate-pulse" style={{animationDuration:'1.5s'}}>
          <span style={{fontSize: '22px'}}>🚓</span>
        </div>
        {/* Finish Flag */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 animate-spin" style={{animationDuration:'6s'}}>
          <span style={{fontSize: '20px'}}>🏁</span>
        </div>
      </>
    )
  },

  berry: {
    name: 'Princess',
    bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    elements: (
      <>
        {/* Crown */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce" style={{animationDuration:'2.5s'}}>
          <span style={{fontSize: '26px', filter: 'drop-shadow(0 2px 4px rgba(255,105,180,0.4))'}}>👑</span>
        </div>
        {/* Magic Wand */}
        <div className="absolute top-1/3 -right-5 animate-spin" style={{animationDuration:'5s'}}>
          <span style={{fontSize: '22px'}}>🪄</span>
        </div>
        {/* Gem */}
        <div className="absolute -bottom-3 left-1/4 animate-pulse" style={{animationDuration:'2s'}}>
          <span style={{fontSize: '18px'}}>💎</span>
        </div>
      </>
    )
  }
};`;

let c = fs.readFileSync('src/components/ProSettingsModal.jsx', 'utf8');

const regex = /const THEME_DECORATIONS = \{[\s\S]*?\}\n    \)\n  \}\n\};/m;

if (regex.test(c)) {
  c = c.replace(regex, NEW_DECORATIONS);
  fs.writeFileSync('src/components/ProSettingsModal.jsx', c);
  console.log('patched THEME_DECORATIONS in ProSettingsModal');
} else {
  console.log('could not find THEME_DECORATIONS');
}
