"use client";

import { useFormStatus } from "react-dom";

// Disables itself while the form's action runs. With several named buttons in one form,
// only the one that submitted shows as busy.
export default function SubmitButton({
  className,
  name,
  value,
  children,
}: {
  className?: string;
  name?: string;
  value?: string;
  children: React.ReactNode;
}) {
  const { pending, data } = useFormStatus();
  const busy = pending && (name === undefined || data?.get(name) === value);
  return (
    <button className={className} name={name} value={value} disabled={pending} aria-busy={busy}>
      {children}
    </button>
  );
}
