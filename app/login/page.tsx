import { login } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <>
      <h1>Brettspiel-Liste</h1>
      <form action={login} className="row">
        <input name="password" type="password" placeholder="Passwort" required autoFocus />
        <button>Anmelden</button>
      </form>
      {error && <p className="error">Falsches Passwort.</p>}
    </>
  );
}
