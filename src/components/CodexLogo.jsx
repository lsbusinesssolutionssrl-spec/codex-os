export default function CodexLogo({ size = 'md' }) {
  const height = size === 'lg' ? 48 : 36;
  return (
    <img
      src="https://media.base44.com/images/public/6a10cbe3229368323be16c82/5c9eb5b37_LOGOBIANCO.svg"
      alt="Codex Solution"
      style={{ height, width: 'auto' }}
    />
  );
}