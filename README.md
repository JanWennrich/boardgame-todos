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
Ist GameUPC sich nicht sicher, wählt man aus Vorschlägen oder sucht das Spiel per Name; die Auswahl meldet die
App als Stimme an GameUPC zurück. Den gewählten Namen samt BGG-ID merkt sich die App pro Barcode in Redis.

Passwort ändern: `APP_PASSWORD` anpassen und neu deployen – alle sind danach abgemeldet.

Cover für ältere Spiele nachtragen: Spiele von vor der Cover-Anzeige bekommen Barcode, BGG-ID und Cover über
den Barcode-Cache und GameUPC. Ohne `--write` zeigt das Skript nur, was es ändern würde. Spiele, die nie
gescannt wurden, bleiben ohne Cover.

Die Zugangsdaten kommen in eine Datei `.env.backfill`, die danach wieder gelöscht wird. `vercel env pull` hilft
hier nicht, weil Vercel geheime Werte nicht herausgibt.

- `KV_REST_API_URL` und `KV_REST_API_TOKEN`: in Vercel unter **Storage → Datenbank → .env.local**, oder in der
  Upstash-Konsole im Bereich REST API
- `GAMEUPC_API_URL=https://api.gameupc.com/v1` und `GAMEUPC_API_KEY`

```bash
node --env-file=.env.backfill scripts/backfill-covers.ts
node --env-file=.env.backfill scripts/backfill-covers.ts --write
```

## Lokal entwickeln

Lokal läuft eine eigene Redis-Datenbank in Docker, die Produktiv-Daten bleiben unberührt.
Die Zugangsdaten dafür stehen in `.env.development`, das lokale Passwort ist `local`.

```bash
npm install
docker compose up -d
npm run dev
```

Eine `.env.local` (z. B. von `vercel env pull`) überschreibt diese Werte – für die lokale Entwicklung also keine anlegen.
