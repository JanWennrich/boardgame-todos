const COLORS = ["--m-red", "--m-blue", "--m-yellow", "--m-green", "--m-purple", "--m-orange"];

// One layer for all pieces. Its own view-transition-name keeps it live and on top while the
// list animates, instead of freezing inside the page snapshot.
function layer() {
  let el = document.getElementById("confetti");
  if (!el) {
    el = document.createElement("div");
    el.id = "confetti";
    document.body.append(el);
  }
  return el;
}

function piece(i: number, x: number, y: number) {
  const el = document.createElement("i");
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.background = `var(${COLORS[i % COLORS.length]})`;
  if (i % 3 === 0) el.style.borderRadius = "50%";
  layer().append(el);
  return el;
}

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// A fan of confetti shooting up from an element and falling back down.
export function burst(from: Element, count = 28) {
  if (reducedMotion()) return;
  const box = from.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const speed = 70 + Math.random() * 110;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const spin = (Math.random() - 0.5) * 900;
    const el = piece(i, x, y);
    el.animate(
      [
        { transform: "translate(0, 0) rotate(0) scale(0.4)" },
        { transform: `translate(${dx}px, ${dy}px) rotate(${spin / 2}deg) scale(1)`, offset: 0.35 },
        { transform: `translate(${dx * 1.4}px, ${dy + 220}px) rotate(${spin}deg) scale(1)`, opacity: 0 },
      ],
      { duration: 1000 + Math.random() * 500, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)" },
    ).finished.then(() => el.remove());
  }
}

// Confetti falling over the whole screen.
export function rain(count = 90) {
  if (reducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const el = piece(i, Math.random() * innerWidth, -20);
    const sway = (Math.random() - 0.5) * 160;
    const spin = (Math.random() - 0.5) * 1080;
    el.animate(
      [
        { transform: "translate(0, 0) rotate(0)" },
        { transform: `translate(${sway}px, ${innerHeight + 40}px) rotate(${spin}deg)` },
      ],
      { duration: 1800 + Math.random() * 1400, delay: Math.random() * 700, easing: "ease-in", fill: "backwards" },
    ).finished.then(() => el.remove());
  }
}
