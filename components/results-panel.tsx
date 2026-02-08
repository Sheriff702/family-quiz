"use client";

import { motion } from "framer-motion";
import type { PlayerDoc } from "@/lib/types";

type ResultsPanelProps = {
  players: PlayerDoc[];
  questionIndex: number;
  revealActive: boolean;
};

export default function ResultsPanel({
  players,
  questionIndex,
  revealActive,
}: ResultsPanelProps) {
  const answered = players.filter(
    (player) => player.answers?.[questionIndex],
  ).length;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Round Results</h3>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
          {answered}/{players.length} answered
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {players.map((player) => {
          const response = player.answers?.[questionIndex];
          return (
            <motion.div
              key={player.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{player.name}</p>
                <p className="text-xs text-slate-500">
                  {response
                    ? response.isCorrect
                      ? `+${response.points} pts`
                      : "+0 pts"
                    : "No answer"}
                </p>
              </div>
              {revealActive && response && (
                <p className="mt-2 text-xs text-slate-400">
                  "{response.answer}" •{" "}
                  {response.isCorrect ? "Correct" : "Missed"}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
