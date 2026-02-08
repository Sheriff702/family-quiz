"use client";

import { useState } from "react";

type LobbyProps = {
  authReady: boolean;
  displayName: string;
  onNameChange: (value: string) => void;
  onCreate: () => void;
  onJoin: (code: string) => void;
};

export default function Lobby({
  authReady,
  displayName,
  onNameChange,
  onCreate,
  onJoin,
}: LobbyProps) {
  const [roomCode, setRoomCode] = useState("");

  return (
    <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <h2 className="text-2xl font-semibold text-white">Create a room</h2>
        <p className="mt-2 text-sm text-slate-400">
          Build a private quiz room for your crew, then share the code.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Display name
          </label>
          <input
            value={displayName}
            onChange={(event) => onNameChange(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
            placeholder="Your name"
          />
          <button
            className="mt-3 rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onCreate}
            disabled={!authReady || !displayName.trim()}
          >
            Create Room
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
        <h3 className="text-xl font-semibold text-white">Join a room</h3>
        <p className="mt-2 text-sm text-slate-400">
          Enter a five-letter room code to jump into the game.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Room code
          </label>
          <input
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
            placeholder="ABCDE"
          />
          <button
            className="mt-2 rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onJoin(roomCode.trim().toUpperCase())}
            disabled={!authReady || !displayName.trim() || roomCode.trim().length !== 5}
          >
            Join Room
          </button>
        </div>
      </div>
    </section>
  );
}
