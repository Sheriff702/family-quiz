"use client";

import { motion } from "framer-motion";
import type { PlayerDoc } from "@/lib/types";
import { cx } from "@/lib/utils";

type PlayerListProps = {
  players: PlayerDoc[];
  highlightId: string | null;
  status: string;
};

export default function PlayerList({
  players,
  highlightId,
  status,
}: PlayerListProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_25px_60px_-40px_rgba(148,163,184,0.8)] backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Players</h3>
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
          {players.length} joined
        </span>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {players.map((player) => (
          <motion.div
            key={player.id}
            className={cx(
              "flex items-center justify-between rounded-2xl border px-4 py-3",
              player.id === highlightId
                ? "border-sky-300/70 bg-sky-100/70"
                : "border-slate-200/80 bg-white/80",
            )}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {player.name}
              </p>
              <p className="text-xs text-slate-500">
                {status === "lobby" ? "Ready to play" : "In the game"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-900">
                {player.score}
              </p>
              <p className="text-xs text-slate-500">points</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
