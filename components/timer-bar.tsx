"use client";

import { motion } from "framer-motion";

type TimerBarProps = {
  value: number;
  max: number;
};

export default function TimerBar({ value, max }: TimerBarProps) {
  const progress = Math.max(0, Math.min(1, value / max));
  return (
    <div className="mt-6 h-3 w-full rounded-full bg-slate-800">
      <motion.div
        className="h-3 rounded-full bg-indigo-500"
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}
