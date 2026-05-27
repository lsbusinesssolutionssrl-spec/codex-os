export default function CodexLogo({ size = 'md' }) {
  const height = size === 'lg' ? 64 : 52;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', height }}>
      <img
        src="https://media.base44.com/images/public/6a10cbe3229368323be16c82/05cba2d43_Codex_OS_final_transparent.png"
        alt="Codex OS"
        style={{ height, width: 'auto' }}
      />
    </div>
  );
}