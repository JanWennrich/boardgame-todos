"use client";

import { useFormStatus } from "react-dom";
import { burst, rain } from "./confetti";
import { tada } from "./sounds";
import { useArmed } from "./use-armed";

// The first tap only arms the button; a second tap within a few seconds submits.
// The last game on the list gets the bigger celebration.
export default function PlayedButton({ last }: { last: boolean }) {
  const { pending } = useFormStatus();
  const { armed, tap, disarm } = useArmed();

  return (
    <button
      className={armed ? "played armed" : "secondary played"}
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (!tap()) return e.preventDefault();
        burst(e.currentTarget);
        if (last) rain();
        tada(last);
      }}
      onBlur={disarm}
    >
      {pending ? "🎉" : armed ? "Sicher? ✓" : "Gespielt ✓"}
    </button>
  );
}
