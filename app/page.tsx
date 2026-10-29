import GameList from "./game-list";
import { listGames } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function Home() {
  const games = await listGames();

  return (
    <>
      <header className="top">
        <p className="eyebrow">🎲 Brettspiel-Liste</p>
        <h1>
          Noch zu spielen
          {games.length > 0 && <span className="count">{games.length}</span>}
        </h1>
      </header>

      <GameList games={games} />
    </>
  );
}
