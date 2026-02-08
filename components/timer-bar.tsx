"use client";

import { motion } from "framer-motion";

type TimerBarProps = {
  value: number;
  max: number;
};

export default function TimerBar({ value, max }: TimerBarProps) {
  const progress = Math.max(0, Math.min(1, value / max));
  return (
    <div className="mt-6 h-3 w-full rounded-full bg-slate-200/80 shadow-inner shadow-slate-200/60">
      <motion.div
        className="h-3 rounded-full bg-gradient-to-r from-sky-400 via-amber-300 to-rose-300"
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}
