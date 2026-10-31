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
      <GameList games={games} allPlayed={played.length > 0} />
      <PlayedList games={played} />
    </>
  );
}
