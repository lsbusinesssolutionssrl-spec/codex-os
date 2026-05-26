export default function CodexLogo({ size = 'md' }) {
  const isLg = size === 'lg';
  return (
    <div className={`flex items-center gap-${isLg ? '3' : '2.5'}`}>
      {/* Icon mark */}
      <svg
        width={isLg ? 36 : 28}
        height={isLg ? 36 : 28}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hexagon background */}
        <path
          d="M18 2L32 10V26L18 34L4 26V10L18 2Z"
          fill="#1147FF"
          opacity="0.15"
        />
        <path
          d="M18 2L32 10V26L18 34L4 26V10L18 2Z"
          stroke="#1147FF"
          strokeWidth="1.5"
          fill="none"
        />
        {/* C mark */}
        <path
          d="M22.5 13C21.2 11.7 19.7 11 18 11C14.1 11 11 14.1 11 18C11 21.9 14.1 25 18 25C19.7 25 21.2 24.3 22.5 23"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Orange accent dot */}
        <circle cx="22.5" cy="18" r="2" fill="#F58220" />
      </svg>

      {/* Wordmark */}
      <div>
        <div
          className={`font-bold tracking-tight leading-none ${isLg ? 'text-xl' : 'text-base'}`}
          style={{ color: 'white', letterSpacing: '-0.02em' }}
        >
          Codex<span style={{ color: '#F58220' }}>OS</span>
        </div>
        <div
          className={`font-medium leading-none mt-0.5 ${isLg ? 'text-sm' : 'text-[10px]'}`}
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Codex Solution
        </div>
      </div>
    </div>
  );
}