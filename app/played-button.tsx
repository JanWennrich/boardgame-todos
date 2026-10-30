"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

// The first tap only arms the button; a second tap within a few seconds submits.
export default function PlayedButton() {
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
        if (armedAt && Date.now() - armedAt > 400) return;
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
