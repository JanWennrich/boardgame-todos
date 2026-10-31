import GameList from "./game-list";
import PlayedList from "./played-list";
import { listGames } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function Home() {
  const all = await listGames();
  const games = all.filter((g) => !g.playedAt);
  const played = all.filter((g) => g.playedAt).sort((a, b) => b.playedAt! - a.playedAt!);

  return (
    <>
      <header className="top">
        <p className="eyebrow">🎲 Brettspiel-Liste</p>
        <h1>
          Noch zu spielen
          {/* key: a new badge pops whenever the number changes. */}
          {games.length > 0 && (
            <span key={games.length} className="count">
              {games.length}
            </span>
          )}
        </h1>
      </header>

      <GameList games={games} allPlayed={played.length > 0} />
      <PlayedList games={played} />
    </>
  );
}
