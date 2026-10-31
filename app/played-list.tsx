import { ViewTransition } from "react";
import type { Game } from "@/lib/games";
import GameDetails from "./game-details";
import Meeple, { colorFor } from "./meeple";

// Rendered on the server, so pin the time zone instead of using the server's.
const date = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Berlin" });

export default function PlayedList({ games }: { games: Game[] }) {
  if (games.length === 0) return null;

  return (
    <section className="played-list">
      <ViewTransition update="move" default="none">
        <h2>
          Schon gespielt
          <span key={games.length} className="count">
            {games.length}
          </span>
        </h2>
      </ViewTransition>
      <ul className="games done">
        {games.map((game) => (
          // Same name as in the list above, so a game moves between the two.
          <ViewTransition key={game.id} name={`game-${game.id}`} share="move" update="move" exit="pop-out" default="none">
            <li>
              <Meeple color={colorFor(game.id)} />
              <GameDetails game={game}>
                {game.name}
                <time dateTime={new Date(game.playedAt!).toISOString()}>{date.format(game.playedAt)}</time>
              </GameDetails>
            </li>
          </ViewTransition>
        ))}
      </ul>
    </section>
  );
}
