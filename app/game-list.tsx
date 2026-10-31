"use client";

import { useState, ViewTransition } from "react";
import type { Game } from "@/lib/games";
import { markPlayed } from "./actions";
import AddGame, { type Highlight } from "./add-game";
import Meeple, { colorFor } from "./meeple";
import PlayedButton from "./played-button";

export default function GameList({ games, allPlayed }: { games: Game[]; allPlayed: boolean }) {
  // The game just added (flashes) or the existing one a duplicate pointed at (wiggles).
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  // Cards pop in on page load. Later ones enter through the view transition instead, so a game
  // coming back from the played list doesn't pop while it moves.
  const [intro, setIntro] = useState(games.length > 0);

  return (
    <>
      <AddGame onResult={setHighlight} />

      {games.length === 0 ? (
        <ViewTransition enter="pop" default="none">
          <div className={allPlayed ? "empty cheer" : "empty"}>
            <div className="meeples">
              <Meeple color={0} />
              <Meeple color={2} />
              <Meeple color={4} />
            </div>
            {allPlayed ? (
              <p>
                <strong>Alles durchgespielt! 🏆</strong>
                <br />
                Zeit für neue Spiele.
              </p>
            ) : (
              <p>
                <strong>Die Liste ist leer.</strong>
                <br />
                Zeit, neue Spiele draufzusetzen!
              </p>
            )}
          </div>
        </ViewTransition>
      ) : (
        <ul
          className={intro ? "games intro" : "games"}
          onAnimationEnd={(e) => {
            if (e.animationName === "pop-in") setIntro(false);
          }}
        >
          {games.map((game) => {
            const effect = highlight?.id === game.id ? (highlight.added ? "flash" : "wiggle") : undefined;
            return (
              // Named after the game, so it moves over to the played list (and back) instead of
              // vanishing in one place and appearing in the other.
              <ViewTransition key={game.id} name={`game-${game.id}`} share="move" update="move" enter="pop" default="none">
                <li
                  className={effect}
                  ref={effect ? (li) => li?.scrollIntoView({ block: "nearest", behavior: "smooth" }) : undefined}
                  onAnimationEnd={(e) => {
                    if (e.animationName === effect) setHighlight(null);
                  }}
                >
                  <Meeple color={colorFor(game.id)} />
                  <span className="name">{game.name}</span>
                  <form action={markPlayed.bind(null, game.id)}>
                    <PlayedButton last={games.length === 1} />
                  </form>
                </li>
              </ViewTransition>
            );
          })}
        </ul>
      )}
    </>
  );
}
