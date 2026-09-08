export const BANNER_PRESETS = [
  { id: 'none', label: 'None' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'cyber', label: 'Cyber Grid' },
  { id: 'sunset', label: 'Solar Flare' },
  { id: 'ocean', label: 'Deep Ocean' },
  { id: 'nebula', label: 'Nebula' }
];

export function getBannerStyle(id) {
  const backgrounds = {
    aurora: 'radial-gradient(circle at 15% 20%, #8b5cf6, transparent 35%), radial-gradient(circle at 85% 30%, #22d3ee, transparent 35%), linear-gradient(120deg, #111827, #312e81, #0f766e)',
    cyber: 'linear-gradient(115deg, rgba(34,211,238,.85), rgba(99,102,241,.9) 45%, rgba(236,72,153,.85)), repeating-linear-gradient(0deg, rgba(255,255,255,.12) 0 1px, transparent 1px 14px)',
    sunset: 'radial-gradient(circle at 70% 0%, #facc15, transparent 32%), linear-gradient(120deg, #7c2d12, #db2777 50%, #4c1d95)',
    ocean: 'radial-gradient(circle at 20% 10%, #67e8f9, transparent 28%), linear-gradient(145deg, #082f49, #075985 55%, #164e63)',
    nebula: 'radial-gradient(circle at 25% 30%, #f0abfc, transparent 18%), radial-gradient(circle at 80% 70%, #818cf8, transparent 30%), linear-gradient(120deg, #111827, #581c87, #172554)'
  };
  if (!backgrounds[id]) return {};
  return {
    background: backgrounds[id],
    backgroundSize: id === 'cyber' ? 'auto, auto' : '180% 180%',
    animation: 'banner-motion 9s ease-in-out infinite'
  };
}
