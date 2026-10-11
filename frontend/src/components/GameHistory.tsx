import { useState } from "react";
import type { GameHistory } from "../types/game";
import EmptyState from "./common/EmptyState";

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
      <EmptyState
        icon="🎮"
        title="No matches played yet"
        description="Your match history will appear here after your first battle in the arena."
        action={{
          label: "Enter Game Arena",
          to: "/game",
        }}
        compact
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#27272a] bg-[#111113]">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="border-b border-[#27272a] bg-[#0a0a0b] text-xs uppercase tracking-wider text-zinc-400">
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
          <tbody className="divide-y divide-[#27272a]">
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
                  className="transition-colors hover:bg-[#18181b]"
                >
                  {/* Result Badge */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {isDraw ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3f3f46] bg-[#27272a] px-3 py-1 text-xs font-semibold text-zinc-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
                        Draw
                      </span>
                    ) : isWon ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Victory
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        Defeat
                      </span>
                    )}
                  </td>

                  {/* Circle User */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5ab0e6]/20 text-xs font-bold text-[#5ab0e6]">
                        O
                      </span>
                      <span
                        className={
                          isCircle
                            ? "font-semibold text-white flex items-center gap-1.5"
                            : "text-zinc-300"
                        }
                      >
                        {game.circle_user_name}
                        {isCircle && (
                          <span className="rounded bg-[#5ab0e6]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#5ab0e6]">
                            You
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Cross User */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7c6ee6]/20 text-xs font-bold text-[#7c6ee6]">
                        X
                      </span>
                      <span
                        className={
                          isCross
                            ? "font-semibold text-white flex items-center gap-1.5"
                            : "text-zinc-300"
                        }
                      >
                        {game.cross_user_name}
                        {isCross && (
                          <span className="rounded bg-[#7c6ee6]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#7c6ee6]">
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
                      className="group/btn inline-flex items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#0a0a0b] px-2.5 py-1 text-xs font-mono text-zinc-400 hover:border-[#3f3f46] hover:text-white"
                      title="Click to copy room ID"
                    >
                      <span>{game.room_id}</span>
                      <span className="text-[10px] text-zinc-500 group-hover/btn:text-emerald-400">
                        {copiedId === game.room_id ? "✓ Copied" : "📋"}
                      </span>
                    </button>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 whitespace-nowrap text-xs text-zinc-400">
                    {formatDate(game.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="divide-y divide-[#27272a] md:hidden">
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
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#3f3f46] bg-[#27272a] px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
                    ● Draw
                  </span>
                ) : isWon ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    ● Victory
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                    ● Defeat
                  </span>
                )}
                <span className="text-[11px] text-zinc-400">
                  {formatDate(game.created_at)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-[#27272a] bg-[#0a0a0b] p-2.5">
                  <div className="flex items-center gap-1.5 text-[#5ab0e6] font-semibold mb-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5ab0e6]/20 text-[10px]">
                      O
                    </span>
                    <span>Circle</span>
                  </div>
                  <p className="truncate font-medium text-zinc-200">
                    {game.circle_user_name}
                    {isCircle && (
                      <span className="ml-1 text-[10px] text-[#5ab0e6]">
                        (You)
                      </span>
                    )}
                  </p>
                </div>

                <div className="rounded-lg border border-[#27272a] bg-[#0a0a0b] p-2.5">
                  <div className="flex items-center gap-1.5 text-[#7c6ee6] font-semibold mb-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7c6ee6]/20 text-[10px]">
                      X
                    </span>
                    <span>Cross</span>
                  </div>
                  <p className="truncate font-medium text-zinc-200">
                    {game.cross_user_name}
                    {isCross && (
                      <span className="ml-1 text-[10px] text-[#7c6ee6]">
                        (You)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-zinc-400">
                <span>Room: <code className="font-mono text-zinc-300">{game.room_id}</code></span>
                <button
                  onClick={() => handleCopyRoomId(game.room_id)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
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
