"use client";

import GameShell from "@/components/game-shell";
import { useGameRoom } from "@/lib/use-game-room";

export default function Home() {
  const { state, actions } = useGameRoom();

  return <GameShell state={state} actions={actions} />;
}
