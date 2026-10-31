"use client";

import { useEffect, useState } from "react";
import { addGame } from "./actions";
import AddSheet from "./add-sheet";
import { clack, thud, unlockAudio } from "./sounds";

export type Highlight = { id: string; added: boolean };

export default function AddGame({ onResult }: { onResult: (highlight: Highlight) => void }) {
  const [open, setOpen] = useState(false);
  // key restarts the toast when the same text comes twice.
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function add(formData: FormData) {
    // The sheet closes itself once this returns.
    const result = await addGame(formData);
    if (!result) return;
    if (result.added) clack();
    else thud();
    const { name } = result.game;
    setToast({
      text: result.added ? `${name} wurde hinzugefügt 🎉` : `„${name}“ steht schon auf der Liste.`,
      key: Date.now(),
    });
    onResult({ id: result.game.id, added: result.added });
  }

  return (
    <>
      <div className="toast-region" role="status">
        {toast && (
          <p key={toast.key} className="toast">
            {toast.text}
          </p>
        )}
      </div>

      <button
        className="fab"
        onClick={() => {
          // Now, during the tap, so the scan beep can play later.
          unlockAudio();
          setOpen(true);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Spiel hinzufügen
      </button>

      {open && <AddSheet onAdd={add} onClose={() => setOpen(false)} />}
    </>
  );
}
