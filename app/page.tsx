import { addGame, logout, markPlayed } from "./actions";
import { listGames } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function Home() {
  const games = await listGames();

  return (
    <>
      <header>
        <h1>Noch zu spielen</h1>
        <form action={logout}>
          <button className="link">Abmelden</button>
        </form>
      </header>

      <form action={addGame} className="row">
        <input name="name" placeholder="Name des Spiels" required maxLength={200} autoComplete="off" />
        <button>Hinzufügen</button>
      </form>

      {games.length === 0 ? (
        <p className="empty">Keine Spiele auf der Liste.</p>
      ) : (
        <ul>
          {games.map((game) => (
            <li key={game.id}>
              <span>{game.name}</span>
              <form action={markPlayed.bind(null, game.id)}>
                <button className="secondary">Gespielt ✓</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
