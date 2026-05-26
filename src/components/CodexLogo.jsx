export default function CodexLogo({ size = 'md' }) {
  const height = size === 'lg' ? 48 : 36;
  const fontSize = size === 'lg' ? '13px' : '10px';
  return (
    <div className="flex flex-col items-start gap-0.5">
      <img
        src="https://media.base44.com/images/public/6a10cbe3229368323be16c82/5c9eb5b37_LOGOBIANCO.svg"
        alt="Codex Solution"
        style={{ height, width: 'auto' }}
      />
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize, letterSpacing: '0.15em', fontWeight: 600 }}>CODEX OS</span>
    </div>
  );
}