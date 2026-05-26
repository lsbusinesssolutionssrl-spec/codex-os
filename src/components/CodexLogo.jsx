export default function CodexLogo({ size = 'md' }) {
  const height = size === 'lg' ? 48 : 38;
  return (
    <div className="flex items-center" style={{ gap: 3 }}>
      <img
        src="https://media.base44.com/images/public/6a10cbe3229368323be16c82/5c9eb5b37_LOGOBIANCO.svg"
        alt="Codex Solution"
        style={{ height, width: 'auto' }}
      />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: height,
        paddingTop: 1,
        paddingBottom: 1,
      }}>
        <span style={{
          color: '#F58220',
          fontSize: height * 0.48,
          fontWeight: 900,
          lineHeight: 1,
          fontFamily: 'inherit',
          letterSpacing: '-0.03em',
        }}>O</span>
        <span style={{
          color: '#F58220',
          fontSize: height * 0.48,
          fontWeight: 900,
          lineHeight: 1,
          fontFamily: 'inherit',
          letterSpacing: '-0.03em',
        }}>S</span>
      </div>
    </div>
  );
}