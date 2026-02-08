"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  buildGameQuestions,
  QUESTION_COUNT,
  ROUND_DURATION_MS,
} from "@/lib/questions";
import {
  GameDoc,
  PlayerDoc,
  PlayerAnswer,
  Question,
} from "@/lib/types";
import { formatMs, randomCode } from "@/lib/utils";
import AnswerCard from "@/components/answer-card";
import Lobby from "@/components/lobby";
import PlayerList from "@/components/player-list";
import QuestionBoard from "@/components/question-board";
import ResultsPanel from "@/components/results-panel";
import TimerBar from "@/components/timer-bar";

export default function Home() {
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [game, setGame] = useState<GameDoc | null>(null);
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [localAnswer, setLocalAnswer] = useState<PlayerAnswer | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [now, setNow] = useState(Date.now());
  const animationLock = useRef(false);
  const firebaseReady = Boolean(auth && db);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setAuthReady(true);
        return;
      }
      signInAnonymously(auth).catch(() => setAuthReady(true));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setPlayers([]);
      return;
    }
    if (!db) return;
    const gameRef = doc(db, "games", gameId);
    const unsubGame = onSnapshot(gameRef, (snap) => {
      setGame(snap.exists() ? (snap.data() as GameDoc) : null);
    });
    const playersRef = collection(db, "games", gameId, "players");
    const unsubPlayers = onSnapshot(playersRef, (snap) => {
      const next = snap.docs.map((docSnap) => docSnap.data() as PlayerDoc);
      setPlayers(next.sort((a, b) => b.score - a.score));
    });
    return () => {
      unsubGame();
      unsubPlayers();
    };
  }, [db, gameId]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, []);

  const player = useMemo(
    () => players.find((item) => item.id === userId) ?? null,
    [players, userId],
  );

  const question = useMemo<Question | null>(() => {
    if (!game) return null;
    return game.questions[game.currentQuestionIndex] ?? null;
  }, [game]);

  const timeLeftMs = useMemo(() => {
    if (!game?.roundEndsAt) return ROUND_DURATION_MS;
    return Math.max(0, game.roundEndsAt - now);
  }, [game, now]);

  const revealActive = useMemo(() => {
    if (!game) return false;
    if (game.status === "reveal") return true;
    if (!game.revealAt) return false;
    return now >= game.revealAt;
  }, [game, now]);

  useEffect(() => {
    if (!game || !userId || !question) {
      setLocalAnswer(null);
      return;
    }
    const existing = players
      .find((entry) => entry.id === userId)
      ?.answers?.[game.currentQuestionIndex];
    setLocalAnswer(existing ?? null);
  }, [game, players, userId, question]);

  useEffect(() => {
    if (!game || !userId || !question || !db) return;
    if (game.hostId !== userId) return;
    if (game.status !== "playing") return;
    if (game.roundEndsAt && now >= game.roundEndsAt) {
      void updateDoc(doc(db, "games", game.id), {
        status: "reveal",
        revealAt: Date.now(),
      });
      return;
    }
    const allAnswered = players.every((entry) =>
      Boolean(entry.answers?.[game.currentQuestionIndex]),
    );
    if (allAnswered) {
      void updateDoc(doc(db, "games", game.id), {
        status: "reveal",
        revealAt: Date.now(),
      });
    }
  }, [db, game, now, players, question, userId]);

  useEffect(() => {
    if (!game || !userId || !question || !db) return;
    if (game.hostId !== userId) return;
    if (!revealActive) return;
    if (game.scoredQuestions.includes(game.currentQuestionIndex)) return;
    const currentAnswers = players
      .map((entry) => ({
        player: entry,
        answer: entry.answers?.[game.currentQuestionIndex] ?? null,
      }))
      .filter((entry) => entry.answer?.isCorrect);
    const fastest =
      currentAnswers.length > 0
        ? Math.min(
            ...currentAnswers.map((entry) => entry.answer?.timeMs ?? Infinity),
          )
        : null;
    const batch = writeBatch(db);
    players.forEach((entry) => {
      const response = entry.answers?.[game.currentQuestionIndex];
      if (!response || response.scored) return;
      let points = 0;
      if (response.isCorrect) {
        points += 1000;
        if (fastest !== null && response.timeMs === fastest) {
          points += 250;
        }
      }
      const playerRef = doc(db, "games", game.id, "players", entry.id);
      batch.update(playerRef, {
        score: entry.score + points,
        answers: {
          ...entry.answers,
          [game.currentQuestionIndex]: {
            ...response,
            scored: true,
            points,
          },
        },
      });
    });
    const gameRef = doc(db, "games", game.id);
    batch.update(gameRef, {
      scoredQuestions: [...game.scoredQuestions, game.currentQuestionIndex],
    });
    void batch.commit();
  }, [db, game, players, question, revealActive, userId]);

  const createGame = async () => {
    if (!userId || !displayName.trim() || !db) return;
    const code = randomCode(5);
    const questions = buildGameQuestions();
    const gameRef = doc(db, "games", code);
    const newGame: GameDoc = {
      id: code,
      code,
      hostId: userId,
      status: "lobby",
      currentQuestionIndex: 0,
      roundStartedAt: null,
      roundEndsAt: null,
      revealAt: null,
      scoredQuestions: [],
      questions,
      createdAt: Date.now(),
    };
    await setDoc(gameRef, newGame);
    const playerRef = doc(db, "games", code, "players", userId);
    const newPlayer: PlayerDoc = {
      id: userId,
      name: displayName.trim(),
      score: 0,
      joinedAt: Date.now(),
      answers: {},
    };
    await setDoc(playerRef, newPlayer);
    setGameId(code);
  };

  const joinGame = async (code: string) => {
    if (!userId || !displayName.trim() || !db) return;
    const gameRef = doc(db, "games", code);
    const snap = await getDoc(gameRef);
    if (!snap.exists()) return;
    const playerRef = doc(db, "games", code, "players", userId);
    const newPlayer: PlayerDoc = {
      id: userId,
      name: displayName.trim(),
      score: 0,
      joinedAt: Date.now(),
      answers: {},
    };
    await setDoc(playerRef, newPlayer, { merge: true });
    setGameId(code);
  };

  const startGame = async () => {
    if (!game || !db) return;
    const gameRef = doc(db, "games", game.id);
    const roundStartedAt = Date.now();
    await updateDoc(gameRef, {
      status: "playing",
      currentQuestionIndex: 0,
      roundStartedAt,
      roundEndsAt: roundStartedAt + ROUND_DURATION_MS,
      revealAt: null,
    });
  };

  const nextRound = async () => {
    if (!game || !db) return;
    const nextIndex = game.currentQuestionIndex + 1;
    if (nextIndex >= QUESTION_COUNT) {
      await updateDoc(doc(db, "games", game.id), {
        status: "finished",
        roundStartedAt: null,
        roundEndsAt: null,
        revealAt: null,
      });
      return;
    }
    const roundStartedAt = Date.now();
    await updateDoc(doc(db, "games", game.id), {
      status: "playing",
      currentQuestionIndex: nextIndex,
      roundStartedAt,
      roundEndsAt: roundStartedAt + ROUND_DURATION_MS,
      revealAt: null,
    });
  };

  const handleAnswer = async (answer: string, cardEl: HTMLElement | null) => {
    if (!game || !question || !userId || !player || !db) return;
    if (game.status !== "playing") return;
    if (localAnswer || isAnimating || animationLock.current) return;
    animationLock.current = true;
    setIsAnimating(true);
    const isCorrect = answer === question.correctAnswer;
    const timeMs = game.roundStartedAt
      ? Math.max(0, Date.now() - game.roundStartedAt)
      : 0;
    const answerPayload: PlayerAnswer = {
      answer,
      isCorrect,
      answeredAt: Date.now(),
      timeMs,
      scored: false,
      points: 0,
    };
    await updateDoc(doc(db, "games", game.id, "players", userId), {
      answers: {
        ...player.answers,
        [game.currentQuestionIndex]: answerPayload,
      },
    });
    setLocalAnswer(answerPayload);
    setIsAnimating(false);
    animationLock.current = false;
    if (cardEl) {
      const event = new CustomEvent("answer-selected", {
        detail: { answer, isCorrect, element: cardEl },
        bubbles: true,
      });
      cardEl.dispatchEvent(event);
    }
  };

  const resetRoom = () => {
    setGameId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              What Did I Google
            </p>
            <h1 className="text-4xl font-semibold text-white">
              Multiplayer Quiz Party
            </h1>
          </div>
          {game && (
            <div className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200">
              Room Code:{" "}
              <span className="font-semibold text-white">{game.code}</span>
            </div>
          )}
        </header>

        {!game && (
          <Lobby
            authReady={authReady && firebaseReady}
            displayName={displayName}
            onNameChange={setDisplayName}
            onCreate={createGame}
            onJoin={joinGame}
          />
        )}
        {!firebaseReady && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-6 py-4 text-sm text-amber-200">
            Add Firebase environment variables to enable multiplayer play.
          </div>
        )}

        {game && (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      {game.status === "lobby"
                        ? "Waiting for everyone"
                        : game.status === "finished"
                          ? "Game complete"
                          : `Question ${game.currentQuestionIndex + 1} of ${QUESTION_COUNT}`}
                    </p>
                    <h2 className="text-2xl font-semibold text-white">
                      {game.status === "lobby"
                        ? "Lobby"
                        : game.status === "finished"
                          ? "Final Results"
                          : "Choose the ending"}
                    </h2>
                  </div>
                  {game.status !== "lobby" && game.status !== "finished" && (
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Time Left
                      </p>
                      <p className="text-2xl font-semibold text-white">
                        {formatMs(timeLeftMs)}
                      </p>
                    </div>
                  )}
                </div>

                {game.status === "lobby" && (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      className="rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                      onClick={startGame}
                      disabled={game.hostId !== userId}
                    >
                      Start Game
                    </button>
                    <button
                      className="rounded-full border border-slate-700 px-5 py-3 text-sm text-slate-200 transition hover:border-slate-500"
                      onClick={resetRoom}
                    >
                      Leave Room
                    </button>
                  </div>
                )}

                {game.status !== "lobby" && question && (
                  <div className="mt-6">
                    <QuestionBoard
                      question={question}
                      revealAnswer={revealActive}
                      selectedAnswer={localAnswer?.answer ?? null}
                      isCorrect={localAnswer?.isCorrect ?? null}
                    />
                    <TimerBar value={timeLeftMs} max={ROUND_DURATION_MS} />
                  </div>
                )}
              </div>

              {game.status !== "lobby" && question && (
                <div className="grid gap-4 md:grid-cols-2">
                  {question.options.map((option) => (
                    <AnswerCard
                      key={option}
                      answer={option}
                      disabled={
                        game.status !== "playing" ||
                        Boolean(localAnswer) ||
                        isAnimating ||
                        revealActive
                      }
                      onSelect={handleAnswer}
                      revealAnswer={revealActive}
                      correctAnswer={question.correctAnswer}
                    />
                  ))}
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-6">
              <PlayerList
                players={players}
                highlightId={userId}
                status={game.status}
              />
              {game.status !== "lobby" && question && (
                <ResultsPanel
                  players={players}
                  questionIndex={game.currentQuestionIndex}
                  revealActive={revealActive}
                />
              )}
              {game.status !== "lobby" &&
                game.status !== "finished" &&
                game.hostId === userId &&
                revealActive && (
                  <button
                    className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                    onClick={nextRound}
                  >
                    Next Round
                  </button>
                )}
              {game.status === "finished" && (
                <button
                  className="rounded-full border border-slate-700 px-5 py-3 text-sm text-slate-200 transition hover:border-slate-500"
                  onClick={resetRoom}
                >
                  Leave Room
                </button>
              )}
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
