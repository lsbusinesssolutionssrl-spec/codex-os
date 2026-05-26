export default function CodexLogo({ size = 'md' }) {
  const height = size === 'lg' ? 48 : 36;
  return (
    <div className="flex items-center gap-2">
      <img
        src="https://media.base44.com/images/public/6a10cbe3229368323be16c82/5c9eb5b37_LOGOBIANCO.svg"
        alt="Codex Solution"
        style={{ height, width: 'auto' }}
      />
      <span style={{ color: '#F58220', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>OS</span>
    </div>
  );
}