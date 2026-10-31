import { useEffect, useRef, useState } from "react";

// For buttons that need a second tap: the first tap only arms them, a second tap within a few
// seconds confirms. Call disarm on blur, so an armed button doesn't stay armed elsewhere.
export function useArmed() {
  const [armedAt, setArmedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function disarm() {
    clearTimeout(timer.current);
    setArmedAt(null);
  }

  // True when this tap confirms. A quick double tap is ignored, so it can't confirm by accident.
  function tap() {
    if (armedAt) return Date.now() - armedAt > 400;
    setArmedAt(Date.now());
    timer.current = setTimeout(disarm, 3000);
    return false;
  }

  return { armed: armedAt !== null, tap, disarm };
}
