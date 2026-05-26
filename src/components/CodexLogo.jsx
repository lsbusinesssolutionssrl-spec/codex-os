export default function CodexLogo({ size = 'md' }) {
  const height = size === 'lg' ? 48 : 38;
  return (
    <div className="flex items-center" style={{ gap: 0 }}>
      <img
        src="https://media.base44.com/images/public/6a10cbe3229368323be16c82/5c9eb5b37_LOGOBIANCO.svg"
        alt="Codex Solution"
        style={{ height, width: 'auto' }}
      />
      {/* separator */}
      <div style={{
        width: 1.5,
        height: height * 0.75,
        backgroundColor: '#F58220',
        borderRadius: 2,
        margin: '0 7px',
        opacity: 0.9,
        flexShrink: 0,
      }} />
      {/* OS vertical */}
      <span style={{
        color: '#F58220',
        fontSize: height * 0.48,
        fontWeight: 800,
        letterSpacing: '0.12em',
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        lineHeight: 1,
        height: height,
        display: 'flex',
        alignItems: 'center',
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        textTransform: 'uppercase',
      }}>OS</span>
    </div>
  );
}