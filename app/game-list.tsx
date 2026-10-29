"use client";

import { useState } from "react";
import type { Game } from "@/lib/games";
import { markPlayed } from "./actions";
import AddGame, { type Highlight } from "./add-game";
import Meeple, { colorFor } from "./meeple";
import PlayedButton from "./played-button";

export default function GameList({ games }: { games: Game[] }) {
  // The game just added (flashes) or the existing one a duplicate pointed at (wiggles).
  const [highlight, setHighlight] = useState<Highlight | null>(null);

  return (
    <>
      <AddGame onResult={setHighlight} />

      {games.length === 0 ? (
        <div className="empty">
          <div className="meeples">
            <Meeple color={0} />
            <Meeple color={2} />
            <Meeple color={4} />
          </div>
          <p>
            <strong>Die Liste ist leer.</strong>
            <br />
            Zeit, neue Spiele draufzusetzen!
          </p>
        </div>
      ) : (
        <ul className="games">
          {games.map((game) => {
            const effect = highlight?.id === game.id ? (highlight.added ? "flash" : "wiggle") : undefined;
            return (
              <li
                key={game.id}
                className={effect}
                ref={effect ? (li) => li?.scrollIntoView({ block: "nearest", behavior: "smooth" }) : undefined}
                onAnimationEnd={(e) => {
                  if (e.animationName === effect) setHighlight(null);
                }}
              >
                <Meeple color={colorFor(game.id)} />
                <span className="name">{game.name}</span>
                <form action={markPlayed.bind(null, game.id)}>
                  <PlayedButton />
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
