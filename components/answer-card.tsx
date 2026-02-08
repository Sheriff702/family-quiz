"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

type AnswerCardProps = {
  answer: string;
  disabled?: boolean;
  onSelect: (answer: string, element: HTMLElement | null) => void;
  revealAnswer: boolean;
  correctAnswer: string;
};

export default function AnswerCard({
  answer,
  disabled,
  onSelect,
  revealAnswer,
  correctAnswer,
}: AnswerCardProps) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const isCorrect = revealAnswer && answer === correctAnswer;
  const isIncorrect = revealAnswer && answer !== correctAnswer;

  return (
    <motion.button
      ref={ref}
      type="button"
      data-answer={answer}
      className={[
        "flex min-h-[88px] items-center justify-between rounded-2xl border px-5 py-4 text-left text-base font-semibold transition",
        "bg-slate-900/80 text-slate-100 border-slate-800",
        disabled ? "cursor-not-allowed opacity-60" : "hover:border-indigo-400",
        isCorrect ? "border-emerald-400/80 bg-emerald-500/10" : "",
        isIncorrect ? "border-rose-400/70 bg-rose-500/10" : "",
      ].join(" ")}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={() => onSelect(answer, ref.current)}
      disabled={disabled}
    >
      <span>{answer}</span>
      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
        Select
      </span>
    </motion.button>
  );
}
