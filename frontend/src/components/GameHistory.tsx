import { useState } from "react";
import type { GameHistory } from "../types/game";

type GameHistoryProps = {
  games: GameHistory[];
  userId: number | undefined;
  limit?: number;
};

export default function GameHistoryComponent({
  games,
  userId,
  limit,
}: GameHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const displayedGames = limit ? games.slice(0, limit) : games;

  const handleCopyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (!games || games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center backdrop-blur-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-2xl text-slate-400">
          🎮
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-200">
          No matches played yet
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Your match history will appear here after your first battle.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Result
              </th>
              <th scope="col" className="px-5 py-3.5">
                Circle (O)
              </th>
              <th scope="col" className="px-5 py-3.5">
                Cross (X)
              </th>
              <th scope="col" className="px-5 py-3.5">
                Room Code
              </th>
              <th scope="col" className="px-5 py-3.5">
                Date & Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {displayedGames.map((game) => {
              const isCircle = game.circle_user_id === userId;
              const isCross = game.cross_user_id === userId;
              const isDraw = game.winner === "draw";
              const isWon =
                (!isDraw &&
                  ((game.winner === "circle" && isCircle) ||
                    (game.winner === "cross" && isCross))) ||
                false;

              return (
                <tr
                  key={game.id}
                  className="transition-colors hover:bg-slate-800/30"
                >
                  {/* Result Badge */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {isDraw ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                        Draw
                      </span>
                    ) : isWon ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        Victory
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                        Defeat
                      </span>
                    )}
                  </td>

                  {/* Circle User */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                        O
                      </span>
                      <span
                        className={
                          isCircle
                            ? "font-semibold text-white flex items-center gap-1.5"
                            : "text-slate-300"
                        }
                      >
                        {game.circle_user_name}
                        {isCircle && (
                          <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300">
                            You
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Cross User */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
                        X
                      </span>
                      <span
                        className={
                          isCross
                            ? "font-semibold text-white flex items-center gap-1.5"
                            : "text-slate-300"
                        }
                      >
                        {game.cross_user_name}
                        {isCross && (
                          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-300">
                            You
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Room ID */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleCopyRoomId(game.room_id)}
                      className="group/btn inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-xs font-mono text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      title="Click to copy room ID"
                    >
                      <span>{game.room_id}</span>
                      <span className="text-[10px] text-slate-500 group-hover/btn:text-indigo-400">
                        {copiedId === game.room_id ? "✓ Copied" : "📋"}
                      </span>
                    </button>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400">
                    {formatDate(game.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="divide-y divide-slate-800/60 md:hidden">
        {displayedGames.map((game) => {
          const isCircle = game.circle_user_id === userId;
          const isCross = game.cross_user_id === userId;
          const isDraw = game.winner === "draw";
          const isWon =
            (!isDraw &&
              ((game.winner === "circle" && isCircle) ||
                (game.winner === "cross" && isCross))) ||
            false;

          return (
            <div key={game.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                {isDraw ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                    ● Draw
                  </span>
                ) : isWon ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                    ● Victory
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
                    ● Defeat
                  </span>
                )}
                <span className="text-[11px] text-slate-400">
                  {formatDate(game.created_at)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 text-[10px]">
                      O
                    </span>
                    <span>Circle</span>
                  </div>
                  <p className="truncate font-medium text-slate-200">
                    {game.circle_user_name}
                    {isCircle && (
                      <span className="ml-1 text-[10px] text-cyan-400">
                        (You)
                      </span>
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5">
                  <div className="flex items-center gap-1.5 text-purple-400 font-semibold mb-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500/20 text-[10px]">
                      X
                    </span>
                    <span>Cross</span>
                  </div>
                  <p className="truncate font-medium text-slate-200">
                    {game.cross_user_name}
                    {isCross && (
                      <span className="ml-1 text-[10px] text-purple-400">
                        (You)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <span>Room: <code className="font-mono text-slate-300">{game.room_id}</code></span>
                <button
                  onClick={() => handleCopyRoomId(game.room_id)}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  {copiedId === game.room_id ? "Copied!" : "Copy Code"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
