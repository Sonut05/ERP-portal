interface LogoIconProps {
  size?: number;
  className?: string;
}

export default function LogoIcon({ size = 32, className = '' }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="erpGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="erpGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="erpGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0.8" />
        </linearGradient>
        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Outer Hexagon Frame */}
      <path
        d="M24 3L43.0526 14V34L24 45L4.94744 34V14L24 3Z"
        fill="url(#erpGrad1)"
        fillOpacity="0.15"
        stroke="url(#erpGrad1)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Layered ERP/CRM Isometric Blocks */}
      {/* Top Diamond / Growth Roof */}
      <path
        d="M24 10L35 16.5L24 23L13 16.5L24 10Z"
        fill="url(#erpGrad1)"
        filter="url(#logoShadow)"
      />

      {/* Left Wall / CRM Nodes */}
      <path
        d="M13 18.5L23 24.3V36.5L13 30.7V18.5Z"
        fill="url(#erpGrad2)"
        fillOpacity="0.9"
      />

      {/* Right Wall / ERP Data Core */}
      <path
        d="M25 24.3L35 18.5V30.7L25 36.5V24.3Z"
        fill="url(#erpGrad1)"
        fillOpacity="0.8"
      />

      {/* Upward Pulse Indicator Line */}
      <path
        d="M16 26L21 21L26 24L32 17"
        stroke="url(#erpGlow)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="17" r="2" fill="#ffffff" />
    </svg>
  );
}
