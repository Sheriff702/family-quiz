"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  buildGameQuestions,
  QUESTION_COUNT,
  ROUND_DURATION_MS,
} from "@/lib/questions";
import { GameDoc, PlayerDoc, PlayerAnswer, Question } from "@/lib/types";
import { randomCode } from "@/lib/utils";
import { formatFirebaseError, getStoredGuestId } from "@/lib/game-helpers";

export type GameRoomState = {
  firebaseReady: boolean;
  canCreateOrJoin: boolean;
  displayName: string;
  game: GameDoc | null;
  players: PlayerDoc[];
  playerId: string | null;
  question: Question | null;
  timeLeftMs: number;
  revealActive: boolean;
  currentAnswer: PlayerAnswer | null;
  isAnimating: boolean;
  actionError: string | null;
};

export type GameRoomActions = {
  setDisplayName: (value: string) => void;
  createGame: () => Promise<void>;
  joinGame: (code: string) => Promise<void>;
  startGame: () => Promise<void>;
  nextRound: () => Promise<void>;
  handleAnswer: (answer: string, cardEl: HTMLElement | null) => Promise<void>;
  resetRoom: () => Promise<void>;
};

export const useGameRoom = (): {
  state: GameRoomState;
  actions: GameRoomActions;
} => {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [game, setGame] = useState<GameDoc | null>(null);
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [localAnswerState, setLocalAnswerState] = useState<{
    questionIndex: number | null;
    answer: PlayerAnswer | null;
  }>({ questionIndex: null, answer: null });
  const [isAnimating, setIsAnimating] = useState(false);
  const [now, setNow] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const animationLock = useRef(false);
  const firebaseReady = Boolean(db);

  const ensurePlayerId = () => {
    if (playerId) return playerId;
    const next = getStoredGuestId();
    setPlayerId(next);
    return next;
  };

  useEffect(() => {
    if (!gameId || !db) return;
    const firestore = db;
    const gameRef = doc(firestore, "games", gameId);
    const unsubGame = onSnapshot(gameRef, (snap) => {
      setGame(snap.exists() ? (snap.data() as GameDoc) : null);
    });
    const playersRef = collection(firestore, "games", gameId, "players");
    const unsubPlayers = onSnapshot(playersRef, (snap) => {
      const next = snap.docs.map((docSnap) => docSnap.data() as PlayerDoc);
      setPlayers(next.sort((a, b) => b.score - a.score));
    });
    return () => {
      unsubGame();
      unsubPlayers();
    };
  }, [gameId]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, []);

  const player = useMemo(
    () => players.find((item) => item.id === playerId) ?? null,
    [players, playerId],
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

  const currentAnswer = useMemo<PlayerAnswer | null>(() => {
    if (!game || !playerId) return null;
    const synced =
      players.find((entry) => entry.id === playerId)?.answers?.[
        game.currentQuestionIndex
      ] ?? null;
    if (localAnswerState.questionIndex !== game.currentQuestionIndex) {
      return synced;
    }
    return localAnswerState.answer ?? synced;
  }, [game, localAnswerState, playerId, players]);

  useEffect(() => {
    if (!game || !playerId || !question || !db) return;
    const firestore = db;
    if (game.hostId !== playerId) return;
    if (game.status !== "playing") return;
    if (game.roundEndsAt && now >= game.roundEndsAt) {
      void updateDoc(doc(firestore, "games", game.id), {
        status: "reveal",
        revealAt: Date.now(),
      });
    }
  }, [game, now, question, playerId]);

  useEffect(() => {
    if (!game || !playerId || !question || !db) return;
    const firestore = db;
    if (game.hostId !== playerId) return;
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
    const batch = writeBatch(firestore);
    for (const entry of players) {
      const response = entry.answers?.[game.currentQuestionIndex];
      if (!response || response.scored) continue;
      let points = 0;
      if (response.isCorrect) {
        points += 1000;
        if (fastest !== null && response.timeMs === fastest) {
          points += 250;
        }
      }
      const playerRef = doc(firestore, "games", game.id, "players", entry.id);
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
    }
    const gameRef = doc(firestore, "games", game.id);
    batch.update(gameRef, {
      scoredQuestions: [...game.scoredQuestions, game.currentQuestionIndex],
    });
    void batch.commit();
  }, [game, players, question, revealActive, playerId]);

  const createGame = async () => {
    setActionError(null);
    if (!displayName.trim()) {
      setActionError("Add a display name to create a room.");
      return;
    }
    if (!firebaseReady || !db) {
      setActionError(
        "Firebase isn't ready. Check your environment variables and restart the dev server.",
      );
      return;
    }
    const firestore = db;
    const resolvedPlayerId = ensurePlayerId();
    const code = randomCode(5);
    const questions = buildGameQuestions();
    const gameRef = doc(firestore, "games", code);
    const newGame: GameDoc = {
      id: code,
      code,
      hostId: resolvedPlayerId,
      status: "lobby",
      currentQuestionIndex: 0,
      roundStartedAt: null,
      roundEndsAt: null,
      revealAt: null,
      scoredQuestions: [],
      questions,
      createdAt: Date.now(),
    };
    try {
      await setDoc(gameRef, newGame);
      const playerRef = doc(
        firestore,
        "games",
        code,
        "players",
        resolvedPlayerId,
      );
      const newPlayer: PlayerDoc = {
        id: resolvedPlayerId,
        name: displayName.trim(),
        score: 0,
        joinedAt: Date.now(),
        answers: {},
      };
      await setDoc(playerRef, newPlayer);
      setGameId(code);
    } catch (error) {
      setActionError(
        formatFirebaseError(error, "Could not create the room. Try again."),
      );
    }
  };

  const joinGame = async (code: string) => {
    setActionError(null);
    if (!displayName.trim()) {
      setActionError("Add a display name to join a room.");
      return;
    }
    if (!firebaseReady || !db) {
      setActionError(
        "Firebase isn't ready. Check your environment variables and restart the dev server.",
      );
      return;
    }
    const firestore = db;
    const resolvedPlayerId = ensurePlayerId();
    const gameRef = doc(firestore, "games", code);
    try {
      const snap = await getDoc(gameRef);
      if (!snap.exists()) {
        setActionError(
          "That room code doesn't exist. Check the code and try again.",
        );
        return;
      }
      const playerRef = doc(
        firestore,
        "games",
        code,
        "players",
        resolvedPlayerId,
      );
      const newPlayer: PlayerDoc = {
        id: resolvedPlayerId,
        name: displayName.trim(),
        score: 0,
        joinedAt: Date.now(),
        answers: {},
      };
      await setDoc(playerRef, newPlayer, { merge: true });
      setGameId(code);
    } catch (error) {
      setActionError(
        formatFirebaseError(error, "Could not join the room. Try again."),
      );
    }
  };

  const startGame = async () => {
    if (!game || !db) return;
    const firestore = db;
    const gameRef = doc(firestore, "games", game.id);
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
    const firestore = db;
    const nextIndex = game.currentQuestionIndex + 1;
    if (nextIndex >= QUESTION_COUNT) {
      await updateDoc(doc(firestore, "games", game.id), {
        status: "finished",
        roundStartedAt: null,
        roundEndsAt: null,
        revealAt: null,
      });
      return;
    }
    const roundStartedAt = Date.now();
    await updateDoc(doc(firestore, "games", game.id), {
      status: "playing",
      currentQuestionIndex: nextIndex,
      roundStartedAt,
      roundEndsAt: roundStartedAt + ROUND_DURATION_MS,
      revealAt: null,
    });
  };

  const handleAnswer = async (answer: string, cardEl: HTMLElement | null) => {
    if (!game || !question || !playerId || !player || !db) return;
    const firestore = db;
    if (game.status !== "playing") return;
    if (currentAnswer || isAnimating || animationLock.current) return;
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
    await updateDoc(doc(firestore, "games", game.id, "players", playerId), {
      answers: {
        ...player.answers,
        [game.currentQuestionIndex]: answerPayload,
      },
    });
    setLocalAnswerState({
      questionIndex: game.currentQuestionIndex,
      answer: answerPayload,
    });
    setIsAnimating(false);
    animationLock.current = false;
    if (cardEl) {
      const event = new CustomEvent("answer-selected", {
        detail: { answer, element: cardEl },
        bubbles: true,
      });
      cardEl.dispatchEvent(event);
    }
  };

  const cleanupRoom = async () => {
    if (!game || !db) return false;
    const firestore = db;
    try {
      const batch = writeBatch(firestore);
      for (const entry of players) {
        batch.delete(doc(firestore, "games", game.id, "players", entry.id));
      }
      batch.delete(doc(firestore, "games", game.id));
      await batch.commit();
      return true;
    } catch (error) {
      setActionError(
        formatFirebaseError(
          error,
          "Could not delete the room data. Try again.",
        ),
      );
      return false;
    }
  };

  const resetRoom = async () => {
    if (game?.status === "finished" && game.hostId === playerId) {
      setActionError(null);
      const cleaned = await cleanupRoom();
      if (!cleaned) return;
    }
    setGame(null);
    setPlayers([]);
    setLocalAnswerState({ questionIndex: null, answer: null });
    setIsAnimating(false);
    setActionError(null);
    setGameId(null);
  };

  const canCreateOrJoin = Boolean(firebaseReady);

  return {
    state: {
      firebaseReady,
      canCreateOrJoin,
      displayName,
      game,
      players,
      playerId,
      question,
      timeLeftMs,
      revealActive,
      currentAnswer,
      isAnimating,
      actionError,
    },
    actions: {
      setDisplayName,
      createGame,
      joinGame,
      startGame,
      nextRound,
      handleAnswer,
      resetRoom,
    },
  };
};
