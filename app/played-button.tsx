"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { burst, rain } from "./confetti";
import { tada } from "./sounds";

// The first tap only arms the button; a second tap within a few seconds submits.
// The last game on the list gets the bigger celebration.
export default function PlayedButton({ last }: { last: boolean }) {
  const { pending } = useFormStatus();
  const [armedAt, setArmedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function disarm() {
    clearTimeout(timer.current);
    setArmedAt(null);
  }

  return (
    <button
      className={armedAt ? "played armed" : "secondary played"}
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        // Ignore a quick double tap so it can't confirm by accident.
        if (armedAt && Date.now() - armedAt > 400) {
          burst(e.currentTarget);
          if (last) rain();
          tada(last);
          return;
        }
        e.preventDefault();
        if (armedAt) return;
        setArmedAt(Date.now());
        timer.current = setTimeout(disarm, 3000);
      }}
      onBlur={disarm}
    >
      {pending ? "🎉" : armedAt ? "Sicher? ✓" : "Gespielt ✓"}
    </button>
  );
}
