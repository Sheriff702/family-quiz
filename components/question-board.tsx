"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import type { Question } from "@/lib/types";

type QuestionBoardProps = {
  question: Question;
  revealAnswer: boolean;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
};

export default function QuestionBoard({
  question,
  revealAnswer,
  selectedAnswer,
  isCorrect,
}: QuestionBoardProps) {
  const gapRef = useRef<HTMLSpanElement | null>(null);
  const [lockedAnswer, setLockedAnswer] = useState<string | null>(null);

  const questionText = useMemo(() => {
    return question.sentenceStart.trim();
  }, [question.sentenceStart]);

  const animateToGap = useCallback(
    (answerEl: HTMLElement, answer: string, correct: boolean) => {
      if (!gapRef.current) return;
      const gapEl = gapRef.current;
      const clone = answerEl.cloneNode(true) as HTMLElement;
      const answerRect = answerEl.getBoundingClientRect();
      const gapRect = gapEl.getBoundingClientRect();
      clone.style.position = "fixed";
      clone.style.left = `${answerRect.left}px`;
      clone.style.top = `${answerRect.top}px`;
      clone.style.width = `${answerRect.width}px`;
      clone.style.height = `${answerRect.height}px`;
      clone.style.zIndex = "50";
      clone.style.pointerEvents = "none";
      document.body.appendChild(clone);
      gsap.to(clone, {
        duration: 0.6,
        ease: "power3.out",
        x: gapRect.left - answerRect.left,
        y: gapRect.top - answerRect.top,
        scale: 0.85,
        onComplete: () => {
          if (correct) {
            setLockedAnswer(answer);
            gsap.fromTo(
              gapEl,
              { boxShadow: "0 0 0 rgba(0,0,0,0)" },
              {
                duration: 0.6,
                boxShadow: "0 0 20px rgba(52, 211, 153, 0.9)",
                yoyo: true,
                repeat: 1,
              },
            );
            clone.remove();
          } else {
            gsap.to(clone, {
              duration: 0.35,
              x: "+=18",
              y: "-=18",
              opacity: 0,
              rotation: 8,
              ease: "power2.in",
              onComplete: () => {
                clone.remove();
                setLockedAnswer(null);
              },
            });
          }
        },
      });
    },
    [],
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        answer: string;
        isCorrect: boolean;
        element: HTMLElement | null;
      }>;
      if (!customEvent.detail?.element) return;
      animateToGap(
        customEvent.detail.element,
        customEvent.detail.answer,
        customEvent.detail.isCorrect,
      );
    };
    document.addEventListener("answer-selected", handler as EventListener);
    return () => {
      document.removeEventListener("answer-selected", handler as EventListener);
    };
  }, [animateToGap]);

  useEffect(() => {
    if (!gapRef.current) return;
    if (!revealAnswer) return;
    if (lockedAnswer === question.correctAnswer) return;
    const gapEl = gapRef.current;
    setLockedAnswer(question.correctAnswer);
    gsap.fromTo(
      gapEl,
      { scale: 0.9 },
      { duration: 0.4, scale: 1, ease: "back.out(1.8)" },
    );
  }, [lockedAnswer, question.correctAnswer, revealAnswer]);

  useEffect(() => {
    if (!revealAnswer) {
      setLockedAnswer(null);
    }
  }, [revealAnswer, question.id]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
        Complete the search
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-2xl font-semibold text-white">
        <span>{questionText}</span>
        <motion.span
          ref={gapRef}
          className="inline-flex min-w-[220px] items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/60 px-4 py-2 text-center text-lg text-slate-200"
          animate={
            revealAnswer
              ? { borderColor: "#34d399", color: "#ffffff" }
              : { borderColor: "#334155", color: "#e2e8f0" }
          }
          transition={{ duration: 0.3 }}
        >
          {lockedAnswer ?? "______"}
        </motion.span>
      </div>
      {revealAnswer && (
        <motion.p
          className="mt-4 text-sm text-slate-400"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isCorrect ? "Nailed it!" : "Not quite — the real search was above."}
        </motion.p>
      )}
    </div>
  );
}
