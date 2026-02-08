export type Question = {
  id: string;
  sentenceStart: string;
  correctAnswer: string;
  options: string[];
};

export type PlayerAnswer = {
  answer: string;
  isCorrect: boolean;
  answeredAt: number;
  timeMs: number;
  scored: boolean;
  points: number;
};

export type PlayerDoc = {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
  answers: Record<number, PlayerAnswer>;
};

export type GameDoc = {
  id: string;
  code: string;
  hostId: string;
  status: "lobby" | "playing" | "reveal" | "finished";
  currentQuestionIndex: number;
  roundStartedAt: number | null;
  roundEndsAt: number | null;
  revealAt: number | null;
  scoredQuestions: number[];
  questions: Question[];
  createdAt: number;
};
