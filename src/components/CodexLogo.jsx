export default function CodexLogo({ size = 'md' }) {
  const height = size === 'lg' ? 48 : 36;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, height }}>
      {/* K Icon - Chevron + Slash */}
      <svg
        width={height * 0.7}
        height={height}
        viewBox="0 0 60 100"
        style={{ flexShrink: 0 }}
      >
        <path d="M 10 15 L 35 50 L 10 85" fill="white" stroke="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
        <path d="M 32 15 L 60 85" fill="white" stroke="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
      </svg>

      {/* CODEX + S and O */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
        {/* CODEX */}
        <span style={{
          color: 'white',
          fontSize: height * 0.65,
          fontWeight: 900,
          letterSpacing: '0.02em',
          fontFamily: '\'Segoe UI\', system-ui, -apple-system, sans-serif',
          lineHeight: 1,
        }}>CODEX</span>
        
        {/* S superscript */}
        <span style={{
          color: '#FF5722',
          fontSize: height * 0.38,
          fontWeight: 900,
          marginLeft: 3,
          marginTop: -height * 0.18,
          lineHeight: 1,
          display: 'inline-block',
        }}>S</span>
      </div>

      {/* O subscript */}
      <span style={{
        color: '#FF5722',
        fontSize: height * 0.42,
        fontWeight: 900,
        marginLeft: 2,
        marginTop: height * 0.12,
        lineHeight: 1,
        display: 'inline-block',
      }}>O</span>
    </div>
  );
}