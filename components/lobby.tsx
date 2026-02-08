"use client";

import { useState } from "react";

type LobbyProps = {
  canPlay: boolean;
  displayName: string;
  onNameChange: (value: string) => void;
  onCreate: () => void;
  onJoin: (code: string) => void;
};

export default function Lobby({
  canPlay,
  displayName,
  onNameChange,
  onCreate,
  onJoin,
}: LobbyProps) {
  const [roomCode, setRoomCode] = useState("");

  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-[0_25px_60px_-40px_rgba(148,163,184,0.8)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">Create a room</h2>
        <p className="mt-2 text-sm text-slate-500">
          Build a private quiz room for your crew, then share the code.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Display name
          </label>
          <input
            value={displayName}
            onChange={(event) => onNameChange(event.target.value)}
            className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 focus:border-sky-400 focus:outline-none"
            placeholder="Your name"
          />
          <button
            className="mt-3 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-200/60 transition hover:translate-y-[-1px] hover:shadow-amber-200/80 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onCreate}
            disabled={!canPlay || !displayName.trim()}
          >
            Create Room
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-inner shadow-slate-200/60">
        <h3 className="text-2xl font-semibold text-slate-900">Join a room</h3>
        <p className="mt-2 text-sm text-slate-500">
          Enter a five-letter room code to jump into the game.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Room code
          </label>
          <input
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 focus:border-sky-400 focus:outline-none"
            placeholder="ABCDE"
          />
          <button
            className="mt-2 rounded-full border border-slate-200/80 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onJoin(roomCode.trim().toUpperCase())}
            disabled={
              !canPlay || !displayName.trim() || roomCode.trim().length !== 5
            }
          >
            Join Room
          </button>
        </div>
      </div>
    </section>
  );
}
