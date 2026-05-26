export default function CodexLogo({ size = 'md' }) {
  // Show only the top ~65% of the SVG to clip out "SOLUTION", then add "OS" below
  const totalH = size === 'lg' ? 72 : 54;
  const clipH = Math.round(totalH * 0.65);
  const fontSize = size === 'lg' ? '12px' : '10px';
  return (
    <div className="flex flex-col items-start" style={{ gap: 2 }}>
      <div style={{ height: clipH, overflow: 'hidden' }}>
        <img
          src="https://media.base44.com/images/public/6a10cbe3229368323be16c82/5c9eb5b37_LOGOBIANCO.svg"
          alt="Codex"
          style={{ height: totalH, width: 'auto', display: 'block' }}
        />
      </div>
      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase' }}>OS</span>
    </div>
  );
}