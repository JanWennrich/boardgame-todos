"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/games";
import { burst, reducedMotion } from "./confetti";
import Cover from "./cover";
import { colorFor } from "./meeple";
import { closeSheet } from "./sheet";
import { fanfare, tick, unlockAudio } from "./sounds";

const STEPS = 22;
const random = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

// "Was spielen wir heute?": a sheet that spins through the list like a prize wheel and lands on
// a random game. onPick gets the game the players went with.
export default function GamePicker({ games, onPick }: { games: Game[]; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="secondary pick"
        onClick={() => {
          // Now, during the tap, so the ticks can play while the wheel spins.
          unlockAudio();
          setOpen(true);
        }}
      >
        <svg viewBox="0 0 24 24" className="die" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="8" cy="8" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="16" cy="16" r="1.7" />
        </svg>
        Was spielen wir heute?
      </button>
      {open && <PickSheet games={games} onPick={onPick} onClose={() => setOpen(false)} />}
    </>
  );
}

function PickSheet({ games, onPick, onClose }: { games: Game[]; onPick: (id: string) => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  // ms: how long this game stays, which is also how long it takes to slide in.
  const [shown, setShown] = useState({ game: games[0], step: 0, ms: 0 });
  const [done, setDone] = useState(false);
  // Counts the spins, so "Nochmal" starts a new one.
  const [round, setRound] = useState(0);
  const close = () => closeSheet(dialogRef.current!);

  useEffect(() => {
    dialogRef.current!.showModal();
    // Covers that load mid-spin would flash up empty.
    for (const game of games) if (game.thumbnailUrl) new Image().src = game.thumbnailUrl;
  }, []);

  useEffect(() => {
    setDone(false);
    // Picked up front, then games lead up to it backwards, never the same one twice in a row.
    const steps = reducedMotion() ? 1 : STEPS;
    const order = [random(games)];
    while (order.length < steps) order.unshift(random(games.filter((g) => g !== order[0])));

    let step = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      // Fast at first, slowing down towards the end.
      const ms = 40 + 420 * (step / steps) ** 3;
      setShown({ game: order[step], step, ms });
      step++;
      if (step < steps) {
        tick(step / steps);
        timer = setTimeout(next, ms);
        return;
      }
      setDone(true);
      fanfare();
      burst(reelRef.current!, 40);
    };
    next();
    return () => clearTimeout(timer);
  }, [round]);

  const { game } = shown;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      // A tap on the backdrop lands on the dialog itself, outside its box.
      onClick={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        const inside = e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom;
        if (e.target === e.currentTarget && !inside) close();
      }}
      className="sheet picker"
      aria-label="Was spielen wir heute?"
    >
      <button type="button" className="secondary close" aria-label="Schließen" title="Schließen" onClick={close}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <p className="eyebrow">{done ? "Heute spielen wir …" : "Die Würfel rollen …"}</p>
      <div ref={reelRef} className={done ? "reel won" : "reel"} aria-live="polite">
        {/* key: every game slides in on its own; the winner pops instead. */}
        <div key={`${round}-${shown.step}`} className="reel-item" style={{ "--ms": `${shown.ms}ms` } as React.CSSProperties}>
          <Cover src={game.thumbnailUrl} color={colorFor(game.id)} />
          <h2 aria-hidden={!done}>{game.name}</h2>
        </div>
      </div>
      <div className="row">
        <button type="button" className="secondary" disabled={!done} onClick={() => setRound(round + 1)}>
          Nochmal 🎲
        </button>
        <button
          type="button"
          disabled={!done}
          onClick={async () => {
            await close();
            onPick(game.id);
          }}
        >
          Los geht’s!
        </button>
      </div>
    </dialog>
  );
}
