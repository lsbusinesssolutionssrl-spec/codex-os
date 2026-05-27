export default function CodexLogo({ size = 'md' }) {
  const height = size === 'lg' ? 48 : 36;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', height }}>
      <img
        src="https://media.base44.com/images/public/6a10cbe3229368323be16c82/eb2824af6_ChatGPTImage27mag202611_57_04.png"
        alt="Codex Solution"
        style={{ height, width: 'auto' }}
      />
    </div>
  );
}