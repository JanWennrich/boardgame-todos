"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { BarcodeDetector as Ponyfill } from "barcode-detector/ponyfill";
import type { Lookup } from "@/lib/barcodes";
import { lookupBarcode, searchGames } from "./actions";
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
  // null while the lookup runs. Search results replace the suggestions.
  const [lookup, setLookup] = useState<Lookup | null>(null);
  // The search form instead of the suggestions, after "none of these".
  const [searching, setSearching] = useState(false);
  // The user ran a search, so a game without a match may be added as typed.
  const [searched, setSearched] = useState(false);
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
    setLookup(null);
    setSearching(false);
    setSearched(false);
    lookupBarcode(detected)
      .catch((): Lookup => ({ suggestions: [], searchedFor: "" }))
      .then(setLookup);
  }

  // Not a form action: the sheet stays open afterwards, and the transition an action ends with
  // would start the list's view transition, whose snapshots of the cards paint over the sheet.
  function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = String(new FormData(e.currentTarget).get("name") ?? "").trim();
    setLookup(null);
    searchGames(code!, query)
      .catch(() => [])
      .then((games) => {
        setLookup({ suggestions: games, searchedFor: query });
        setSearching(false);
        setSearched(true);
      });
  }

  async function add(formData: FormData) {
    await onAdd(formData);
    await close();
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
      ) : code === null ? (
        <form action={add} className="sheet-form">
          <h2>Wie heißt das Spiel?</h2>
          <input name="name" placeholder="Name des Spiels" required maxLength={200} autoComplete="off" autoFocus />
          <SubmitButton>Hinzufügen</SubmitButton>
        </form>
      ) : lookup === null ? (
        <div className="lookup">
          <Meeple color={1} />
          <p>Spiel wird gesucht …</p>
        </div>
      ) : "found" in lookup ? (
        <form action={add} className="sheet-form">
          <input type="hidden" name="barcode" value={code} />
          {lookup.found.id !== undefined && <input type="hidden" name="bgg_id" value={lookup.found.id} />}
          <h2 className="found">Gefunden!</h2>
          <input
            name="name"
            defaultValue={lookup.found.name}
            placeholder="Name des Spiels"
            required
            maxLength={200}
            autoComplete="off"
          />
          <SubmitButton>Hinzufügen</SubmitButton>
        </form>
      ) : searching || !lookup.suggestions.length ? (
        <>
          <form onSubmit={search} className="sheet-form">
            {searched && !lookup.suggestions.length ? (
              <>
                <h2>Nichts gefunden</h2>
                <p>
                  Für „{lookup.searchedFor}“ gibt es keinen Treffer. Versuch einen anderen Namen – oder füg das Spiel
                  ohne Treffer hinzu.
                </p>
              </>
            ) : (
              <>
                <h2>Wie heißt das Spiel?</h2>
                {!searching && <p>Der Barcode ist noch unbekannt. Such das Spiel, dann erkennt GameUPC ihn künftig für alle.</p>}
              </>
            )}
            <input
              name="name"
              defaultValue={lookup.searchedFor}
              placeholder="Name des Spiels"
              required
              maxLength={200}
              autoComplete="off"
              autoFocus
            />
            <button>Suchen</button>
          </form>
          {searched && (
            <form action={add} className="sheet-form">
              <input type="hidden" name="barcode" value={code} />
              <input type="hidden" name="name" value={lookup.searchedFor} />
              <SubmitButton className="secondary">„{lookup.searchedFor}“ ohne Treffer hinzufügen</SubmitButton>
            </form>
          )}
        </>
      ) : (
        <form
          action={(formData) => {
            const game = lookup.suggestions.find((g) => String(g.id) === formData.get("bgg_id"))!;
            formData.set("name", game.name);
            return add(formData);
          }}
          className="sheet-form"
        >
          <input type="hidden" name="barcode" value={code} />
          {/* The user's pick is a vote for this barcode at GameUPC. */}
          <input type="hidden" name="report" value="1" />
          <h2>Welches Spiel ist es?</h2>
          <div className="choices">
            {lookup.suggestions.map((g) => (
              <SubmitButton key={g.id} className="secondary" name="bgg_id" value={String(g.id)}>
                {g.name}
                {g.year && <span className="year"> ({g.year})</span>}
              </SubmitButton>
            ))}
            <button type="button" className="secondary other" onClick={() => setSearching(true)}>
              Keins davon – suchen
            </button>
          </div>
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
          lookup && (
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
