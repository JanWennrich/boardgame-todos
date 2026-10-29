# Brettspiel-Liste

Gemeinsame Liste der Brettspiele, die wir noch spielen wollen. Next.js auf Vercel, Daten in Upstash Redis, geschützt durch ein gemeinsames Passwort.

## Deployment auf Vercel

1. Projekt in ein GitHub-Repo pushen.
2. Auf [vercel.com/new](https://vercel.com/new) das Repo importieren (Framework wird automatisch erkannt).
3. Im Vercel-Projekt unter **Storage → Create Database → Upstash for Redis** eine Datenbank anlegen
   (Free-Plan, Region z. B. Frankfurt) und mit dem Projekt verbinden.
   Die Variablen `KV_REST_API_URL` und `KV_REST_API_TOKEN` werden dabei automatisch gesetzt.
4. Unter **Settings → Environment Variables** `APP_PASSWORD` mit dem gemeinsamen Passwort anlegen.
5. Neu deployen (**Deployments → Redeploy**), damit die Variablen greifen.

Barcode-Scan: Barcodes werden über [GameUPC](https://gameupc.com) einem Spiel zugeordnet. Ohne weitere
Einstellungen nutzt die App deren öffentlichen Test-Server. Für die Produktiv-Datenbank per E-Mail einen
API-Key anfragen und `GAMEUPC_API_URL=https://api.gameupc.com/v1` sowie `GAMEUPC_API_KEY` setzen.
Selbst eingegebene Namen merkt sich die App pro Barcode in Redis.

Passwort ändern: `APP_PASSWORD` anpassen und neu deployen – alle sind danach abgemeldet.

## Lokal entwickeln

Lokal läuft eine eigene Redis-Datenbank in Docker, die Produktiv-Daten bleiben unberührt.
Die Zugangsdaten dafür stehen in `.env.development`, das lokale Passwort ist `local`.

```bash
npm install
docker compose up -d
npm run dev
```

Eine `.env.local` (z. B. von `vercel env pull`) überschreibt diese Werte – für die lokale Entwicklung also keine anlegen.
