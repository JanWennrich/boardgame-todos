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

Passwort ändern: `APP_PASSWORD` anpassen und neu deployen – alle sind danach abgemeldet.

## Lokal entwickeln

```bash
npm install
npx vercel link
npx vercel env pull .env.local
npm run dev
```
