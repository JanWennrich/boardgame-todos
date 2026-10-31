"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { BarcodeDetector as Ponyfill } from "barcode-detector/ponyfill";
import { lookupBarcode } from "./actions";
import Meeple from "./meeple";
import { closeSheet } from "./sheet";
import { beep } from "./sounds";
import SubmitButton from "./submit-button";

type Detector = Pick<Ponyfill, "detect">;
const FORMATS: ("ean_13" | "upc_a")[] = ["ean_13", "upc_a"];

// Native BarcodeDetector where it reads retail barcodes (Chrome on Android and macOS), otherwise
// the ZXing WebAssembly ponyfill, which fetches its .wasm from jsDelivr on first use.
async function createDetector(): Promise<Detector> {
  const Native = (globalThis as { BarcodeDetector?: typeof Ponyfill }).BarcodeDetector;
  if (Native) {
    const supported = await Native.getSupportedFormats();
    if (FORMATS.every((f) => supported.includes(f))) return new Native({ formats: FORMATS });
  }
  const { BarcodeDetector } = await import("barcode-detector/ponyfill");
  return new BarcodeDetector({ formats: FORMATS });
}

let detectorPromise: Promise<Detector> | undefined;
const detector = () => (detectorPromise ??= createDetector());

// Adding a game, start to finish: scan (or type), look the barcode up, confirm or name the game.
export default function AddSheet({
  onAdd,
  onClose,
}: {
  onAdd: (formData: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("Kamera wird gestartet …");
  const [live, setLive] = useState(true);
  const [typing, setTyping] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  // null while the lookup runs.
  const [names, setNames] = useState<string[] | null>(null);
  // A code just scanned: the viewfinder freezes and flashes for a moment before the lookup starts.
  const [hit, setHit] = useState<string | null>(null);
  const scanning = !typing && code === null;

  function registerHit(detected: string) {
    beep();
    navigator.vibrate?.(80);
    videoRef.current?.pause();
    setMessage("Erkannt!");
    setHit(detected);
  }

  function handleDetected(detected: string) {
    setCode(detected);
    setNames(null);
    lookupBarcode(detected)
      .catch(() => [])
      .then(setNames);
  }

  function scanAgain() {
    setTyping(false);
    setCode(null);
    setMessage("Kamera wird gestartet …");
  }

  const close = () => closeSheet(dialogRef.current!);

  const detected = useEffectEvent(handleDetected);
  const onHit = useEffectEvent(registerHit);

  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();

    // iOS Safari lays the on-screen keyboard over the page instead of resizing it, which would
    // hide a sheet anchored to the bottom. Lift the sheet by the covered height.
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      dialog.style.setProperty(
        "--keyboard",
        `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
      );
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    let stopped = false;

    async function scanFrame() {
      const video = videoRef.current;
      if (stopped || !video) return;
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        const [result] = await (await detector()).detect(video);
        if (result && !stopped) return onHit(result.rawValue);
      }
      timer = window.setTimeout(scanFrame, 200);
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        setLive(false);
        return setMessage("Kein Kamerazugriff – mach stattdessen ein Foto vom Barcode.");
      }
      if (stopped) return stream.getTracks().forEach((t) => t.stop());
      videoRef.current!.srcObject = stream;
      setMessage("Barcode auf dem Karton ins Bild halten.");
      scanFrame().catch(() => setMessage("Barcode-Erkennung konnte nicht geladen werden."));
    }

    start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning]);

  useEffect(() => {
    if (hit === null) return;
    const timer = setTimeout(() => {
      setHit(null);
      detected(hit);
    }, 450);
    return () => clearTimeout(timer);
  }, [hit]);

  async function scanPhoto(file: File | undefined) {
    if (!file) return;
    setMessage("Foto wird ausgewertet …");
    try {
      const [result] = await (await detector()).detect(file);
      if (result) registerHit(result.rawValue);
      else setMessage("Kein Barcode erkannt – versuch es mit einem schärferen Foto.");
    } catch {
      setMessage("Barcode-Erkennung konnte nicht geladen werden.");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="sheet"
    >
      {scanning ? (
        <>
          <div className={hit ? "viewfinder hit" : "viewfinder"} hidden={!live}>
            <video ref={videoRef} autoPlay muted playsInline />
          </div>
          <p>{message}</p>
          {!live && (
            <button type="button" onClick={() => fileRef.current?.click()}>
              Foto aufnehmen
            </button>
          )}
        </>
      ) : code !== null && names === null ? (
        <div className="lookup">
          <Meeple color={1} />
          <p>Spiel wird gesucht …</p>
        </div>
      ) : (
        <form
          action={async (formData) => {
            await onAdd(formData);
            await close();
          }}
          className="sheet-form"
        >
          {code && <input type="hidden" name="barcode" value={code} />}
          {names && names.length > 1 ? (
            <>
              <h2>Welches Spiel ist es?</h2>
              <div className="choices">
                {names.map((n) => (
                  <SubmitButton key={n} className="secondary" name="name" value={n}>
                    {n}
                  </SubmitButton>
                ))}
                <button type="button" className="secondary other" onClick={() => setNames([])}>
                  Keins davon – Namen eingeben
                </button>
              </div>
            </>
          ) : (
            <>
              {names?.length ? <h2 className="found">Gefunden!</h2> : <h2>Wie heißt das Spiel?</h2>}
              {names?.length === 0 && <p>Der Barcode ist noch unbekannt. Wir merken uns den Namen fürs nächste Mal.</p>}
              <input
                name="name"
                defaultValue={names?.[0]}
                placeholder="Name des Spiels"
                required
                maxLength={200}
                autoComplete="off"
                autoFocus={!names?.length}
              />
              <SubmitButton>Hinzufügen</SubmitButton>
            </>
          )}
        </form>
      )}

      <div className="row">
        {scanning ? (
          <button type="button" className="secondary" onClick={() => setTyping(true)}>
            Namen eintippen
          </button>
        ) : code === null ? (
          <button type="button" className="secondary" onClick={scanAgain}>
            Barcode scannen
          </button>
        ) : (
          names && (
            <button type="button" className="secondary" onClick={scanAgain}>
              Nochmal scannen
            </button>
          )
        )}
        <button type="button" className="secondary" onClick={close}>
          Abbrechen
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => scanPhoto(e.target.files?.[0])}
      />
    </dialog>
  );
}
