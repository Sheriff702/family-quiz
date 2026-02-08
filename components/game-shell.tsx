"use client";

import { QUESTION_COUNT, ROUND_DURATION_MS } from "@/lib/questions";
import { formatMs } from "@/lib/utils";
import AnswerCard from "@/components/answer-card";
import Lobby from "@/components/lobby";
import PlayerList from "@/components/player-list";
import QuestionBoard from "@/components/question-board";
import ResultsPanel from "@/components/results-panel";
import TimerBar from "@/components/timer-bar";
import type { GameRoomActions, GameRoomState } from "@/lib/use-game-room";

type GameShellProps = {
  state: GameRoomState;
  actions: GameRoomActions;
};

export default function GameShell({ state, actions }: GameShellProps) {
  const {
    firebaseReady,
    missingFirebaseEnvKeys,
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
  } = state;
  const {
    setDisplayName,
    createGame,
    joinGame,
    startGame,
    nextRound,
    handleAnswer,
    resetRoom,
  } = actions;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-[-10%] h-105 w-105 rounded-full bg-sky-300/50 blur-[140px]" />
        <div className="absolute right-[-8%] top-10 h-90 w-90 rounded-full bg-amber-300/50 blur-[130px]" />
        <div className="absolute bottom-[-12%] left-1/3 h-105 w-105 rounded-full bg-rose-300/40 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffff,transparent_60%)] opacity-70" />
      </div>
      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-sky-500/80">
              What Did I Google
            </p>
            <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
              <span className="bg-linear-to-r from-sky-500 via-amber-400 to-rose-400 bg-clip-text text-transparent">
                Multiplayer Quiz Party
              </span>
            </h1>
          </div>
          {game && (
            <div className="rounded-full border border-sky-200/70 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-lg shadow-sky-200/60 backdrop-blur">
              Room Code:{" "}
              <span className="font-semibold text-slate-900">{game.code}</span>
            </div>
          )}
        </header>
        {!game && (
          <Lobby
            canPlay={canCreateOrJoin}
            displayName={displayName}
            onNameChange={setDisplayName}
            onCreate={createGame}
            onJoin={joinGame}
          />
        )}
        {actionError && (
          <div className="rounded-2xl border border-rose-300/70 bg-rose-100/70 px-6 py-4 text-sm text-rose-900 shadow-lg shadow-rose-200/40 backdrop-blur">
            {actionError}
          </div>
        )}
        {!firebaseReady && (
          <div className="rounded-2xl border border-amber-300/70 bg-amber-100/70 px-6 py-4 text-sm text-amber-900 shadow-lg shadow-amber-200/40 backdrop-blur">
            Add Firebase environment variables to enable multiplayer play.
            {missingFirebaseEnvKeys.length > 0 && (
              <p className="mt-2 font-mono text-xs text-amber-950">
                Missing: {missingFirebaseEnvKeys.join(", ")}
              </p>
            )}
          </div>
        )}

        {game && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <section className="flex flex-1 flex-col gap-6">
              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_25px_60px_-40px_rgba(148,163,184,0.8)] backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">
                        {game.status === "lobby"
                          ? "Waiting for everyone"
                          : game.status === "finished"
                            ? "Game complete"
                            : `Question ${game.currentQuestionIndex + 1} of ${QUESTION_COUNT}`}
                      </p>
                      <h2 className="text-3xl font-semibold text-slate-900">
                        {game.status === "lobby"
                          ? "Lobby"
                          : game.status === "finished"
                            ? "Final Results"
                            : "Choose the ending"}
                      </h2>
                    </div>
                    {game.status !== "lobby" && game.status !== "finished" && (
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                          Time Left
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {formatMs(timeLeftMs)}
                        </p>
                      </div>
                    )}
                  </div>

                  {game.status === "lobby" && (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        className="rounded-full bg-linear-to-r from-amber-300 via-rose-300 to-sky-300 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-200/60 transition hover:-translate-y-px hover:shadow-amber-200/80 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={startGame}
                        disabled={game.hostId !== playerId}
                      >
                        Start Game
                      </button>
                      <button
                        className="rounded-full border border-slate-200/80 bg-white/80 px-5 py-3 text-sm text-slate-700 transition hover:border-sky-300 hover:bg-white"
                        onClick={resetRoom}
                      >
                        Leave Room
                      </button>
                    </div>
                  )}

                  {game.status !== "lobby" && question && (
                    <div className="mt-6">
                      <QuestionBoard
                        key={question.id}
                        question={question}
                        revealAnswer={revealActive}
                        showAnswerPopup={timeLeftMs === 0}
                        hasAnswered={Boolean(currentAnswer)}
                        showNextRoundButton={
                          game.status !== "finished" &&
                          game.hostId === playerId &&
                          revealActive
                        }
                        onNextRound={
                          game.hostId === playerId && revealActive
                            ? nextRound
                            : null
                        }
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
                        selected={currentAnswer?.answer === option}
                        disabled={
                          game.status !== "playing" ||
                          Boolean(currentAnswer) ||
                          isAnimating ||
                          revealActive
                        }
                        onSelect={handleAnswer}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
            <section className="flex w-full flex-col gap-6 lg:max-w-sm">
              <PlayerList
                players={players}
                highlightId={playerId}
                status={game.status}
              />
              {game.status !== "lobby" && question && (
                <ResultsPanel
                  players={players}
                  questionIndex={game.currentQuestionIndex}
                  revealActive={revealActive}
                />
              )}
              {game.status === "finished" && (
                <button
                  className="rounded-full border border-slate-200/80 bg-white/80 px-5 py-3 text-sm text-slate-700 transition hover:border-sky-300 hover:bg-white"
                  onClick={resetRoom}
                >
                  {game.hostId === playerId ? "Close Room" : "Leave Room"}
                </button>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
