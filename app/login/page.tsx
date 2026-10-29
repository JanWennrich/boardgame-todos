import { login } from "../actions";
import Meeple from "../meeple";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <section className="login">
      <div className="meeples">
        <Meeple color={0} />
        <Meeple color={1} />
        <Meeple color={2} />
      </div>
      <h1>Brettspiel-Liste</h1>
      <p className="tagline">Was kommt als Nächstes auf den Tisch?</p>
      <form action={login} className="stacked">
        <input name="password" type="password" placeholder="Passwort" required autoFocus />
        <button>Anmelden</button>
      </form>
      {error && <p className="error">Falsches Passwort.</p>}
    </section>
  );
}
