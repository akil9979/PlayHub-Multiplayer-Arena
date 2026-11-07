import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy } from "lucide-react";
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
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight font-display">
                Leaderboard Standings
              </h3>
              <p className="text-[11px] text-zinc-400">Top Arena Competitors</p>
            </div>
          </div>
          <Link
            to="/leaderboard"
            className="group text-xs text-zinc-400 hover:text-white font-medium transition-colors flex items-center gap-1"
          >
            <span>Full Board</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2.5">
          {isLoading ? (
            <div className="space-y-2 py-1 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-[#0d0d10] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-zinc-800" />
                    <div className="h-3.5 w-24 rounded bg-zinc-800" />
                  </div>
                  <div className="h-3.5 w-16 rounded bg-zinc-800" />
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
              icon={<Trophy className="w-6 h-6 text-zinc-500" />}
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
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all duration-150 ${
                    isCurrentUser
                      ? "bg-zinc-850/80 border border-emerald-500/40 shadow-sm"
                      : rank === 1
                      ? "bg-amber-950/20 border border-amber-500/30"
                      : rank === 2
                      ? "bg-zinc-850/50 border border-zinc-700/50"
                      : rank === 3
                      ? "bg-amber-950/15 border border-amber-700/30"
                      : "bg-[#0d0d10] border border-zinc-800/80 hover:bg-[#141419]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Indicator */}
                    <div className="w-6 text-center font-bold font-mono">
                      {rank === 1 ? (
                        <span className="text-base" title="1st Place">🥇</span>
                      ) : rank === 2 ? (
                        <span className="text-base" title="2nd Place">🥈</span>
                      ) : rank === 3 ? (
                        <span className="text-base" title="3rd Place">🥉</span>
                      ) : (
                        <span className="text-zinc-500 text-xs">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar Initial */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                        rank === 1
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                          : rank === 2
                          ? "bg-zinc-700 text-zinc-200 border border-zinc-600"
                          : rank === 3
                          ? "bg-amber-900/40 text-amber-200 border border-amber-800/50"
                          : isCurrentUser
                          ? "bg-emerald-500/20 text-accent border border-emerald-500/40"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                      }`}
                    >
                      {player.name ? player.name.charAt(0).toUpperCase() : "U"}
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-1.5 truncate max-w-[120px] sm:max-w-[160px]">
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
                        <span className="rounded-full bg-emerald-500/20 text-accent border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats Column */}
                  <div className="flex items-center gap-3 text-right font-mono tabular-nums">
                    <div>
                      <span className="font-bold text-accent">{player.wins}W</span>
                      <span className="text-zinc-600 mx-1">•</span>
                      <span className="text-zinc-400">{player.gamesPlayed}M</span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-200 bg-zinc-800/60 px-2 py-0.5 rounded-md border border-zinc-700/40">
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
      <div className="mt-5 pt-3 border-t border-zinc-800/80">
        <Link
          to="/leaderboard"
          className="group flex items-center justify-center gap-2 rounded-xl border border-zinc-750 bg-zinc-850/80 py-2.5 text-xs font-semibold text-white transition-all hover:bg-zinc-800 hover:border-zinc-700 shadow-sm"
        >
          <span>View Full Leaderboard</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
