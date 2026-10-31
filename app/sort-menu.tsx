"use client";

import { useEffect, useRef, useState } from "react";

export type Sort = { key: "date" | "name"; desc: boolean };

export const defaultSort: Sort = { key: "date", desc: false };

const options: { sort: Sort; label: string }[] = [
  { sort: { key: "date", desc: false }, label: "Hinzugefügt: alt → neu" },
  { sort: { key: "date", desc: true }, label: "Hinzugefügt: neu → alt" },
  { sort: { key: "name", desc: false }, label: "Name: A → Z" },
  { sort: { key: "name", desc: true }, label: "Name: Z → A" },
];

const same = (a: Sort, b: Sort) => a.key === b.key && a.desc === b.desc;

export default function SortMenu({ value, onChange }: { value: Sort; onChange: (sort: Sort) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Close on a tap outside or Escape, like a native menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="sort" ref={root}>
      <button
        ref={toggle}
        type="button"
        // Highlighted while the list is not in its default order.
        className={same(value, defaultSort) ? "secondary" : undefined}
        aria-label="Sortieren"
        title="Sortieren"
        aria-expanded={open}
        aria-controls="sort-menu"
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h11M4 18h6" />
        </svg>
      </button>
      {open && (
        <div id="sort-menu" className="sort-menu" role="group" aria-label="Sortieren">
          <p>Sortieren</p>
          {options.map(({ sort, label }) => (
            <button
              key={label}
              type="button"
              aria-pressed={same(sort, value)}
              onClick={() => {
                onChange(sort);
                setOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
