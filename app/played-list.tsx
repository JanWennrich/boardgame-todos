import type { Game } from "@/lib/games";
import { markUnplayed } from "./actions";
import Meeple, { colorFor } from "./meeple";
import SubmitButton from "./submit-button";

// Rendered on the server, so pin the time zone instead of using the server's.
const date = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Berlin" });

export default function PlayedList({ games }: { games: Game[] }) {
  if (games.length === 0) return null;

  return (
    <section className="played-list">
      <h2>
        Schon gespielt
        <span className="count">{games.length}</span>
      </h2>
      <ul className="games done">
        {games.map((game) => (
          <li key={game.id}>
            <Meeple color={colorFor(game.id)} />
            <span className="name">
              {game.name}
              <time dateTime={new Date(game.playedAt!).toISOString()}>{date.format(game.playedAt)}</time>
            </span>
            <form action={markUnplayed.bind(null, game.id)}>
              <SubmitButton className="secondary unplay">Zurück ↺</SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
