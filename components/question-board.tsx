"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import type { Question } from "@/lib/types";

type QuestionBoardProps = {
  question: Question;
  revealAnswer: boolean;
  showAnswerPopup: boolean;
  hasAnswered: boolean;
  selectedAnswer: string | null;
  showNextRoundButton: boolean;
  onNextRound: (() => void | Promise<void>) | null;
};

export default function QuestionBoard({
  question,
  revealAnswer,
  showAnswerPopup,
  hasAnswered,
  selectedAnswer,
  showNextRoundButton,
  onNextRound,
}: QuestionBoardProps) {
  const gapRef = useRef<HTMLSpanElement | null>(null);

  const questionText = useMemo(() => {
    return question.sentenceStart.trim();
  }, [question.sentenceStart]);

  const shouldShowTimedReveal = revealAnswer && showAnswerPopup;

  const animateToGap = useCallback((answerEl: HTMLElement) => {
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
      duration: 0.55,
      ease: "power3.out",
      x: gapRect.left - answerRect.left,
      y: gapRect.top - answerRect.top,
      scale: 0.82,
      onComplete: () => {
        clone.remove();
        gsap.fromTo(
          gapEl,
          {
            boxShadow: "0 0 0 rgba(0,0,0,0)",
            scale: 0.98,
          },
          {
            duration: 0.45,
            boxShadow: "0 0 24px rgba(14,165,233,0.36)",
            scale: 1,
            ease: "power2.out",
          },
        );
      },
    });
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        answer: string;
        element: HTMLElement | null;
      }>;
      if (!customEvent.detail?.element) return;
      animateToGap(customEvent.detail.element);
    };
    document.addEventListener("answer-selected", handler as EventListener);
    return () => {
      document.removeEventListener("answer-selected", handler as EventListener);
    };
  }, [animateToGap]);

  useEffect(() => {
    if (!gapRef.current) return;
    if (!revealAnswer) return;
    const gapEl = gapRef.current;
    gsap.fromTo(
      gapEl,
      { scale: 0.9 },
      { duration: 0.5, scale: 1, ease: "back.out(1.7)" },
    );
  }, [hasAnswered, revealAnswer]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-8 shadow-[0_25px_60px_-40px_rgba(148,163,184,0.8)] backdrop-blur md:p-10">
      <AnimatePresence>
        {shouldShowTimedReveal && (
          <motion.div
            key={`${question.id}-timed-reveal`}
            className="absolute inset-0 z-20 flex items-center justify-center bg-white/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            <motion.div
              className="pointer-events-auto relative w-[min(95%,780px)] overflow-hidden rounded-[34px] border border-sky-200/80 bg-white/95 px-8 py-10 text-center shadow-[0_46px_90px_-34px_rgba(14,116,144,0.78)] md:px-12 md:py-12"
              initial={{ opacity: 0, scale: 0.78, y: 30, filter: "blur(8px)" }}
              animate={{
                opacity: 1,
                scale: [0.78, 1.03, 1],
                y: [30, -8, 0],
                filter: ["blur(8px)", "blur(0px)", "blur(0px)"],
              }}
              transition={{ duration: 0.72, times: [0, 0.7, 1], ease: "easeOut" }}
            >
              <motion.div
                className="absolute -inset-16 -z-10 rounded-full bg-[conic-gradient(from_0deg,rgba(56,189,248,0.28),rgba(251,191,36,0.24),rgba(251,113,133,0.24),rgba(56,189,248,0.28))] blur-3xl"
                animate={{ rotate: [0, 150, 320], scale: [0.9, 1.06, 0.94] }}
                transition={{ duration: 3, ease: "linear" }}
              />
              <motion.p
                className="text-[11px] uppercase tracking-[0.36em] text-slate-500"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 }}
              >
                The Real Search Was
              </motion.p>
              <motion.p
                className="mt-3 text-3xl font-semibold leading-tight text-slate-900 md:text-5xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, delay: 0.3 }}
              >
                {question.correctAnswer}
              </motion.p>
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.38 }}
              >
                {showNextRoundButton ? (
                  <button
                    type="button"
                    className="rounded-full bg-gradient-to-r from-amber-300 via-rose-300 to-sky-300 px-9 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-200/70 transition hover:translate-y-[-1px] hover:shadow-sky-200/90"
                    onClick={onNextRound ?? undefined}
                  >
                    Next Round
                  </button>
                ) : (
                  <p className="text-sm text-slate-600">
                    Waiting for host to continue...
                  </p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
        Complete the search
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4 text-3xl font-semibold text-slate-900 md:text-4xl">
        <span>{questionText}</span>
        <motion.span
          ref={gapRef}
          className="inline-flex min-w-[260px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-amber-50/80 px-6 py-3 text-center text-xl text-slate-900 shadow-inner shadow-amber-200/70 md:min-w-[320px] md:px-8 md:py-4 md:text-2xl"
          animate={
            revealAnswer
              ? { borderColor: "#0ea5e9", color: "#0f172a" }
              : { borderColor: "#94a3b8", color: "#0f172a" }
          }
          transition={{ duration: 0.3 }}
        >
          {selectedAnswer ?? "______"}
        </motion.span>
      </div>

      <motion.p
        className="mt-6 text-base text-slate-500"
        key={`${question.id}-${revealAnswer}-${hasAnswered}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {revealAnswer
          ? "Answer reveal triggered by timer."
          : hasAnswered
            ? "Locked in. Waiting for the timer reveal."
            : "Pick your best ending before time runs out."}
      </motion.p>
    </div>
  );
}
