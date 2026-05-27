export default function CodexLogo({ size = 'md' }) {
  const height = size === 'lg' ? 80 : 64;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
      <img
        src="https://media.base44.com/images/public/6a10cbe3229368323be16c82/57db7c4f1_Codex_OS_big_OS_under_EX_white_transparent.png"
        alt="Codex OS"
        style={{ height, width: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
}