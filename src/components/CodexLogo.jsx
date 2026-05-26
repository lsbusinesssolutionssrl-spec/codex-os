export default function CodexLogo({ size = 'md' }) {
  const height = size === 'lg' ? 48 : 38;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, height }}>
      <img
        src="https://media.base44.com/images/public/6a10cbe3229368323be16c82/5c9eb5b37_LOGOBIANCO.svg"
        alt="Codex Solution"
        style={{ height, width: 'auto' }}
      />
      {/* separator — full height */}
      <div style={{
        width: 1.5,
        height: height,
        backgroundColor: '#F58220',
        borderRadius: 2,
        margin: '0 8px',
        flexShrink: 0,
      }} />
      {/* OS vertical, centered */}
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          color: '#F58220',
          fontSize: height * 0.5,
          fontWeight: 800,
          letterSpacing: '0.12em',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          lineHeight: 1,
          fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        }}>OS</span>
      </div>
    </div>
  );
}