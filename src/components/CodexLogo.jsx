export default function CodexLogo({ size = 'md' }) {
  const height = size === 'lg' ? 48 : 38;
  return (
    <div className="flex items-center" style={{ gap: 4 }}>
      <img
        src="https://media.base44.com/images/public/6a10cbe3229368323be16c82/5c9eb5b37_LOGOBIANCO.svg"
        alt="Codex Solution"
        style={{ height, width: 'auto' }}
      />
      <span style={{
        color: '#F58220',
        fontSize: 15,
        fontWeight: 900,
        letterSpacing: '0.05em',
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        lineHeight: 1,
        height: height,
        display: 'flex',
        alignItems: 'center',
      }}>OS</span>
    </div>
  );
}