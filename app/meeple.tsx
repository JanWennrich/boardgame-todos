const COLORS = 6;

// Stable colour per game, so a meeple keeps its colour when other games leave the list.
export function colorFor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(hash) % COLORS;
}

export default function Meeple({ color }: { color: number }) {
  return (
    <svg viewBox="0 0 24 24" className="meeple" data-color={color} aria-hidden="true">
      <path d="M12 8.6c-4 0-10 1.6-10 4.4 0 1.4 1.8 1.9 4.2 1.5L4.6 21a.8.8 0 0 0 .8 1h4.2l2.4-4.4 2.4 4.4h4.2a.8.8 0 0 0 .8-1l-1.6-6.5c2.4.4 4.2-.1 4.2-1.5 0-2.8-6-4.4-10-4.4z" />
      <circle cx="12" cy="5.4" r="3.4" />
    </svg>
  );
}
