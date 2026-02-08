"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

type AnswerCardProps = {
  answer: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect: (answer: string, element: HTMLElement | null) => void;
};

export default function AnswerCard({
  answer,
  selected,
  disabled,
  onSelect,
}: AnswerCardProps) {
  const ref = useRef<HTMLButtonElement | null>(null);

  return (
    <motion.button
      ref={ref}
      type="button"
      data-answer={answer}
      className={[
        "flex min-h-[96px] items-center justify-between rounded-2xl border px-5 py-4 text-left text-base font-semibold transition",
        "bg-white/90 text-slate-900 border-slate-200/80 shadow-lg shadow-slate-200/60",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:shadow-sky-200/70",
        selected ? "border-sky-300/90 bg-sky-100/80 shadow-sky-200/70" : "",
      ].join(" ")}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={() => onSelect(answer, ref.current)}
      disabled={disabled}
    >
      <span>{answer}</span>
      <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
        Select
      </span>
    </motion.button>
  );
}
