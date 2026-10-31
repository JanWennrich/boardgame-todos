// Short effects synthesised with the Web Audio API, so there are no sound files to load.

let ctx: AudioContext | undefined;

// Browsers only play audio once a tap has allowed it. Call this from a tap handler before a
// sound that plays later on its own, like the scan beep.
export function unlockAudio() {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
}

function audio() {
  unlockAudio();
  return ctx!;
}

// A plucked tone fades out right away, a flat one holds its volume like a piezo buzzer.
function tone(
  freq: number,
  { type = "triangle", at = 0, length = 0.15, volume = 0.15, flat = false }:
    { type?: OscillatorType; at?: number; length?: number; volume?: number; flat?: boolean } = {},
) {
  const c = audio();
  const start = c.currentTime + at;
  const end = start + length;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.005);
  if (flat) gain.gain.setValueAtTime(volume, end - 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(end);
}

// Supermarket checkout scanner.
export function beep() {
  tone(1800, { type: "square", length: 0.13, volume: 0.06, flat: true });
}

// A wooden game piece set down on the table: a filtered click with a short low knock.
export function clack() {
  const c = audio();
  const now = c.currentTime;
  const noise = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 4;
  const click = c.createBufferSource();
  click.buffer = noise;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2200;
  filter.Q.value = 2;
  const gain = c.createGain();
  gain.gain.value = 0.9;
  click.connect(filter).connect(gain).connect(c.destination);
  click.start(now);

  const knock = c.createOscillator();
  const knockGain = c.createGain();
  knock.frequency.setValueAtTime(260, now);
  knock.frequency.exponentialRampToValueAtTime(110, now + 0.08);
  knockGain.gain.setValueAtTime(0.25, now);
  knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  knock.connect(knockGain).connect(c.destination);
  knock.start(now);
  knock.stop(now + 0.1);
}

// Rising arpeggio when a game was played; the last game on the list gets a final chord on top.
export function tada(big = false) {
  [523, 659, 784].forEach((f, i) => tone(f, { at: i * 0.08 }));
  tone(1047, { at: 0.24, length: 0.5 });
  if (big) [1047, 1319, 1568].forEach((f) => tone(f, { at: 0.45, length: 1.1, volume: 0.1 }));
}

// Two falling notes, "uh-oh", for a game that is already on the list.
export function thud() {
  tone(330, { type: "sine", length: 0.14, volume: 0.25 });
  tone(247, { type: "sine", at: 0.16, length: 0.22, volume: 0.25 });
}
