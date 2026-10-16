interface LogoIconProps {
  size?: number;
  className?: string;
}

/** A pallet, seen from the side: two decks and three blocks. Draws in currentColor. */
export default function LogoIcon({ size = 32, className = '' }: LogoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="2" y="4" width="20" height="5" />
      <rect x="2" y="9" width="5" height="6" />
      <rect x="9.5" y="9" width="5" height="6" />
      <rect x="17" y="9" width="5" height="6" />
      <rect x="2" y="15" width="20" height="4" />
    </svg>
  );
}
