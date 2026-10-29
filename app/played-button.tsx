"use client";

import { useFormStatus } from "react-dom";

export default function PlayedButton() {
  const { pending } = useFormStatus();
  return (
    <button className="secondary played" disabled={pending} aria-busy={pending}>
      {pending ? "🎉" : "Gespielt ✓"}
    </button>
  );
}
