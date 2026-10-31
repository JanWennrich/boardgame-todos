"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import type { Game } from "@/lib/games";
import { deleteGame, markPlayed, markUnplayed } from "./actions";
import Meeple, { colorFor } from "./meeple";
import PlayedButton from "./played-button";
import { closeSheet } from "./sheet";
import SubmitButton from "./submit-button";
import { useArmed } from "./use-armed";

const date = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Berlin" });

// The game's name on its card. Tapping the card opens a sheet with details and the actions that
// don't need a button on every card. last: the only game left on the list.
export default function GameDetails({
  game,
  last = false,
  children,
}: {
  game: Game;
  last?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="name" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {children}
      </button>
      {/* In body, so the card's styles and hover effects don't reach into the sheet. */}
      {open && createPortal(<GameSheet game={game} last={last} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function GameSheet({ game, last, onClose }: { game: Game; last: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => closeSheet(dialogRef.current!);

  useEffect(() => {
    dialogRef.current!.showModal();
    // Not the delete button, which would come first.
    closeRef.current!.focus();
  }, []);

  // The sheet gets out of the way first, so the card can be seen moving to the other list.
  async function move(action: (id: string) => Promise<void>) {
    await close();
    await action(game.id);
  }

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
      className="sheet details"
    >
      <button ref={closeRef} type="button" className="secondary close" aria-label="Schließen" title="Schließen" onClick={close}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <Meeple color={colorFor(game.id)} />
      <h2>{game.name}</h2>
      <p>
        Hinzugefügt am {date.format(game.addedAt)}
        {game.playedAt && (
          <>
            <br />
            Gespielt am {date.format(game.playedAt)}
          </>
        )}
      </p>
      <div className="row">
        <form
          action={async () => {
            await deleteGame(game.id);
            await close();
          }}
        >
          <DeleteButton />
        </form>
        {game.playedAt ? (
          <form action={() => move(markUnplayed)}>
            <SubmitButton className="secondary">Ungespielt ↺</SubmitButton>
          </form>
        ) : (
          <form action={() => move(markPlayed)}>
            <PlayedButton last={last} />
          </form>
        )}
      </div>
    </dialog>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  const { armed, tap, disarm } = useArmed();
  // Disabling the button while it deletes blurs it, which disarms it.
  const confirmed = armed || pending;

  return (
    <button
      className={confirmed ? "delete armed" : "secondary delete"}
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (!tap()) e.preventDefault();
      }}
      onBlur={disarm}
    >
      {confirmed ? "Wirklich löschen?" : "Löschen"}
    </button>
  );
}
