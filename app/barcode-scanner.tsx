"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { BarcodeDetector as Ponyfill } from "barcode-detector/ponyfill";

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

export default function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const detectorRef = useRef<Promise<Detector>>(null);
  const [message, setMessage] = useState("Kamera wird gestartet …");
  const [live, setLive] = useState(true);

  const detector = () => (detectorRef.current ??= createDetector());
  const detected = useEffectEvent(onDetected);

  useEffect(() => {
    dialogRef.current?.showModal();
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    let stopped = false;

    async function scanFrame() {
      const video = videoRef.current;
      if (stopped || !video) return;
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        const [hit] = await (await detector()).detect(video);
        if (hit && !stopped) return detected(hit.rawValue);
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
  }, []);

  async function scanPhoto(file: File | undefined) {
    if (!file) return;
    setMessage("Foto wird ausgewertet …");
    try {
      const [hit] = await (await detector()).detect(file);
      if (hit) onDetected(hit.rawValue);
      else setMessage("Kein Barcode erkannt – versuch es mit einem schärferen Foto.");
    } catch {
      setMessage("Barcode-Erkennung konnte nicht geladen werden.");
    }
  }

  return (
    <dialog ref={dialogRef} onClose={onClose} className="scanner">
      <video ref={videoRef} autoPlay muted playsInline hidden={!live} />
      <p>{message}</p>
      <div className="row">
        <button type="button" className="secondary" onClick={() => fileRef.current?.click()}>
          Foto aufnehmen
        </button>
        <button type="button" className="secondary" onClick={() => dialogRef.current?.close()}>
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
