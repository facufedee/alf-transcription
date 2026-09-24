import '@fontsource/bebas-neue/400.css';

const RED = '#ff2f3f';
const YELLOW = '#ffb400';
const TEAL = '#00a8a0';
const GRAY = '#8a8a8a';

const VIBEATHON: [string, string][] = [
  ['V', RED], ['I', YELLOW], ['B', TEAL],
  ['E', RED], ['A', YELLOW], ['T', TEAL],
  ['H', RED], ['O', YELLOW], ['N', TEAL],
];

export default function NerdVibeathon({ className = '' }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Nerd Vibeathon"
      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
      className={`inline-flex items-center whitespace-nowrap leading-none tracking-wide ${className}`}
    >
      <span style={{ color: RED }}>NE</span>
      <span className="text-[0.62em]" style={{ color: GRAY }}>&lt;TAB&gt;</span>
      <span style={{ color: RED }}>RD</span>
      <span className="w-[0.3em]" />
      {VIBEATHON.map(([letter, color], i) => (
        <span key={i} style={{ color }}>{letter}</span>
      ))}
    </span>
  );
}
