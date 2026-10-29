"use client";

import { useState } from "react";
import { addGame, lookupBarcode } from "./actions";
import BarcodeScanner from "./barcode-scanner";

export default function AddGameForm() {
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [candidates, setCandidates] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const [scanning, setScanning] = useState(false);

  function reset() {
    setName("");
    setBarcode("");
    setCandidates([]);
    setHint("");
  }

  async function handleDetected(code: string) {
    setScanning(false);
    reset();
    setBarcode(code);
    setHint("Spiel wird gesucht …");
    const names = await lookupBarcode(code).catch(() => []);
    setName(names[0] ?? "");
    setCandidates(names.length > 1 ? names : []);
    setHint(
      names.length
        ? ""
        : `Barcode ${code} ist unbekannt. Gib den Namen ein – er wird fürs nächste Mal gemerkt.`,
    );
  }

  async function submit(formData: FormData) {
    await addGame(formData);
    reset();
  }

  return (
    <>
      <form action={submit} className="row">
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name des Spiels"
          required
          maxLength={200}
          autoComplete="off"
        />
        <input type="hidden" name="barcode" value={barcode} />
        <button type="button" className="secondary" onClick={() => setScanning(true)} aria-label="Barcode scannen">
          📷
        </button>
        <button>Hinzufügen</button>
      </form>

      {hint && <p className="hint">{hint}</p>}
      {candidates.length > 0 && (
        <div className="candidates">
          {candidates.map((c) => (
            <button key={c} type="button" className="secondary" aria-pressed={c === name} onClick={() => setName(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      {scanning && <BarcodeScanner onDetected={handleDetected} onClose={() => setScanning(false)} />}
    </>
  );
}
