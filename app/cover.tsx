import Meeple from "./meeple";

// The box cover from BGG, or the meeple for games added without one. The name always sits next
// to it, so the image needs no alt text. The slot has the same width for every box shape, so the
// names next to it line up.
export default function Cover({ src, color }: { src?: string; color: number }) {
  return (
    <span className="cover-slot">
      {src ? <img className="cover" src={src} alt="" loading="lazy" /> : <Meeple color={color} />}
    </span>
  );
}
