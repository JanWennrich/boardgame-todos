import { logout, markPlayed } from "./actions";
import AddGameForm from "./add-game-form";
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

      <AddGameForm />

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
