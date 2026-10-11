import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAppSelector } from "../redux/hook";
import ErrorMessage from "./common/ErrorMessage";
import EmptyState from "./common/EmptyState";
import { getErrorMessage } from "../utils/apiError";
import type { LeaderboardEntry } from "../types/game";

export default function LeaderboardPreview() {
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useAppSelector((state) => state.auth.user);

  const fetchTopLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get("/users/leaderboard");
      const data: LeaderboardEntry[] = Array.isArray(res.data) ? res.data : [];
      setTopPlayers(data.slice(0, 5));
    } catch (err) {
      console.error("Failed to load leaderboard preview:", err);
      setError(getErrorMessage(err, "Failed to load standings."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopLeaderboard();
  }, [fetchTopLeaderboard]);

  return (
    <div className="surface-card p-6 sm:p-7 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#27272a] border border-[#3f3f46] text-base">
              🏆
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight flex items-center gap-1.5">
                <span>Leaderboard Standings</span>
              </h3>
              <p className="text-[11px] text-zinc-400">Top Arena Competitors</p>
            </div>
          </div>
          <Link
            to="/leaderboard"
            className="text-xs text-zinc-400 hover:text-white font-medium transition-colors flex items-center gap-1"
          >
            <span>Full Board</span>
            <span>→</span>
          </Link>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2.5">
          {isLoading ? (
            <div className="space-y-2 py-1 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-[#27272a] bg-[#0a0a0b] p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-lg bg-[#27272a]" />
                    <div className="h-3 w-20 rounded bg-[#27272a]" />
                  </div>
                  <div className="h-3 w-16 rounded bg-[#27272a]" />
                </div>
              ))}
            </div>
          ) : error ? (
            <ErrorMessage
              compact
              message={error}
              onRetry={fetchTopLeaderboard}
            />
          ) : topPlayers.length === 0 ? (
            <EmptyState
              compact
              icon="🏆"
              title="No matches recorded yet"
              description="Play a match to claim the #1 spot on the arena leaderboard!"
              action={{
                label: "Play Match",
                to: "/game",
              }}
            />
          ) : (
            topPlayers.map((player, index) => {
              const rank = index + 1;
              const isCurrentUser = currentUser?.id === player.userId;

              return (
                <div
                  key={player.userId}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                    isCurrentUser
                      ? "bg-[#18181b] border border-[#3f3f46]"
                      : rank === 1
                      ? "bg-amber-500/10 border border-amber-500/30"
                      : rank === 2
                      ? "bg-zinc-800/40 border border-zinc-700/40"
                      : rank === 3
                      ? "bg-amber-900/20 border border-amber-800/30"
                      : "bg-[#0a0a0b] border border-[#27272a] hover:bg-[#18181b]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Rank Indicator */}
                    <div className="w-5 text-center font-bold">
                      {rank === 1 ? (
                        <span className="text-base" title="1st Place">🥇</span>
                      ) : rank === 2 ? (
                        <span className="text-base" title="2nd Place">🥈</span>
                      ) : rank === 3 ? (
                        <span className="text-base" title="3rd Place">🥉</span>
                      ) : (
                        <span className="text-zinc-500 font-mono text-[11px]">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar Initial */}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold ${
                        rank === 1
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : rank === 2
                          ? "bg-zinc-700 text-zinc-200 border border-zinc-600"
                          : rank === 3
                          ? "bg-amber-900/40 text-amber-200 border border-amber-800/50"
                          : isCurrentUser
                          ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40"
                          : "bg-[#27272a] text-zinc-300"
                      }`}
                    >
                      {player.name ? player.name.charAt(0).toUpperCase() : "U"}
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-1.5 truncate max-w-[110px] sm:max-w-[130px]">
                      <span
                        className={`truncate font-semibold ${
                          isCurrentUser
                            ? "text-white"
                            : rank === 1
                            ? "text-amber-200"
                            : "text-zinc-200"
                        }`}
                      >
                        {player.name}
                      </span>
                      {isCurrentUser && (
                        <span className="rounded bg-[#22c55e]/20 text-[#22c55e] px-1 py-0.5 text-[8px] font-bold uppercase">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats Column */}
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="font-bold text-emerald-400">{player.wins}W</span>
                      <span className="text-zinc-600 mx-1">•</span>
                      <span className="text-zinc-400">{player.gamesPlayed}M</span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-zinc-300">
                      {player.winRate}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-5 pt-3 border-t border-[#27272a]">
        <Link
          to="/leaderboard"
          className="flex items-center justify-center gap-2 rounded-lg border border-[#3f3f46] bg-[#27272a] py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#3f3f46]"
        >
          <span>View Full Leaderboard</span>
          <span>➔</span>
        </Link>
      </div>
    </div>
  );
}
