interface StatusMarkProps {
  value: string;
  label?: string;
}

/** A small square plus the word. Shape and colour both carry the state, so it still reads without colour. */
export default function StatusMark({ value, label }: StatusMarkProps) {
  const key = value.toLowerCase().replace(/\s+/g, '-');
  return <span className={`mark mark--${key}`}>{label ?? value}</span>;
}
