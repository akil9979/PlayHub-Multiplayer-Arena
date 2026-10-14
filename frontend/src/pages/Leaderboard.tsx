import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAppSelector } from "../redux/hook";
import Navbar from "../components/Navbar";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { TableSkeleton } from "../components/common/Skeletons";
import { getErrorMessage } from "../utils/apiError";
import type { LeaderboardEntry } from "../types/game";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const currentUser = useAppSelector((state) => state.auth.user);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get("/users/leaderboard");
      setLeaderboard(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      setError(
        getErrorMessage(err, "Unable to load leaderboard standings. Please try again.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboard.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = leaderboard.slice(0, 3);
  const currentUserRank = currentUser
    ? leaderboard.findIndex((p) => p.userId === currentUser.id) + 1
    : 0;

  return (
    <div className="page-shell flex flex-col">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        {/* Header Banner */}
        <section className="relative overflow-hidden rounded-xl border border-[#27272a] bg-[#111113] p-6 sm:p-10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold text-[#22c55e]">
                <span>🏆</span>
                <span>Official PlayHub Rankings</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#fafafa]">
                Global Arena Leaderboard
              </h1>
              <p className="text-sm sm:text-base text-[#a1a1aa] leading-relaxed">
                Rankings calculated live from completed competitive matches. Rise through the ranks by outsmarting opponents in 1v1 turn-based combat.
              </p>
            </div>

            {/* Quick User Standing Card */}
            {currentUser && (
              <div className="flex items-center gap-4 rounded-xl border border-[#27272a] bg-[#0a0a0b] p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#3f3f46] bg-[#18181b] text-lg font-black text-[#fafafa]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#fafafa]">{currentUser.name}</p>
                    <span className="rounded-full bg-[#22c55e]/20 border border-[#22c55e]/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#22c55e]">
                      YOU
                    </span>
                  </div>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">
                    {currentUserRank > 0 ? (
                      <span>
                        Current Rank:{" "}
                        <strong className="text-[#22c55e]">#{currentUserRank}</strong> of {leaderboard.length}
                      </span>
                    ) : (
                      <span className="text-amber-400">Play a match to earn a rank!</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Podium for Top 3 Players */}
        {!isLoading && !error && topThree.length >= 2 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-[#fafafa] flex items-center gap-2">
                <span>👑 Champions Podium</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* 2nd Place */}
              {topThree[1] && (
                <div
                  className={`order-2 sm:order-1 relative rounded-xl border border-zinc-600/50 bg-[#111113] p-5 transition-colors ${
                    currentUser?.id === topThree[1].userId ? "ring-1 ring-[#22c55e]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-500 bg-[#18181b] text-lg font-black text-zinc-300">
                        {topThree[1].name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-[#fafafa] text-base">{topThree[1].name}</h3>
                          {currentUser?.id === topThree[1].userId && (
                            <span className="rounded-full bg-[#22c55e]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#22c55e]">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#a1a1aa]">{topThree[1].gamesPlayed} Matches</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">🥈</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                        2nd Rank
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#27272a] pt-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Wins</p>
                      <p className="text-sm font-extrabold text-[#22c55e]">{topThree[1].wins}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Defeats</p>
                      <p className="text-sm font-extrabold text-rose-400">{topThree[1].losses}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Win Rate</p>
                      <p className="text-sm font-extrabold text-[#fafafa]">{topThree[1].winRate}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place - Crown Champion */}
              {topThree[0] && (
                <div
                  className={`order-1 sm:order-2 relative -mt-0 sm:-mt-3 rounded-xl border border-amber-500/50 bg-[#111113] p-6 transition-colors ${
                    currentUser?.id === topThree[0].userId ? "ring-1 ring-[#22c55e]" : ""
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
                    👑 Grand Champion
                  </div>

                  <div className="flex items-start justify-between mt-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-amber-500 bg-[#18181b] text-xl font-black text-amber-400">
                        {topThree[0].name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-[#fafafa] text-lg">{topThree[0].name}</h3>
                          {currentUser?.id === topThree[0].userId && (
                            <span className="rounded-full bg-[#22c55e]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#22c55e]">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-amber-400/80">{topThree[0].gamesPlayed} Matches</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl">🥇</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                        1st Rank
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#27272a] pt-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Wins</p>
                      <p className="text-base font-black text-[#22c55e]">{topThree[0].wins}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Defeats</p>
                      <p className="text-base font-black text-rose-400">{topThree[0].losses}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Win Rate</p>
                      <p className="text-base font-black text-amber-400">{topThree[0].winRate}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div
                  className={`order-3 relative rounded-xl border border-amber-700/50 bg-[#111113] p-5 transition-colors ${
                    currentUser?.id === topThree[2].userId ? "ring-1 ring-[#22c55e]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-amber-700 bg-[#18181b] text-lg font-black text-amber-600">
                        {topThree[2].name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-[#fafafa] text-base">{topThree[2].name}</h3>
                          {currentUser?.id === topThree[2].userId && (
                            <span className="rounded-full bg-[#22c55e]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#22c55e]">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#a1a1aa]">{topThree[2].gamesPlayed} Matches</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">🥉</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                        3rd Rank
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#27272a] pt-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Wins</p>
                      <p className="text-sm font-extrabold text-[#22c55e]">{topThree[2].wins}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Defeats</p>
                      <p className="text-sm font-extrabold text-rose-400">{topThree[2].losses}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#71717a]">Win Rate</p>
                      <p className="text-sm font-extrabold text-[#fafafa]">{topThree[2].winRate}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Main Leaderboard Table Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#fafafa] flex items-center gap-2">
                <span>⚔️ Complete Player Standings</span>
                <span className="rounded-full border border-[#27272a] bg-[#18181b] px-2.5 py-0.5 text-xs font-semibold text-[#a1a1aa]">
                  {leaderboard.length} {leaderboard.length === 1 ? "Player" : "Players"}
                </span>
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Sorted primarily by Victories, followed by Win Rate and total Games Played.
              </p>
            </div>

            {/* Search Input & Action Buttons */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Search player name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 sm:w-64 rounded-lg border border-[#27272a] bg-[#111113] px-3.5 py-2 pl-9 text-xs text-[#fafafa] placeholder-[#71717a] focus:border-[#22c55e] focus:outline-none focus:ring-2 focus:ring-[#22c55e] transition"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-[#71717a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <button
                onClick={fetchLeaderboard}
                disabled={isLoading}
                title="Refresh Standings"
                className="flex items-center justify-center rounded-lg border border-[#27272a] bg-[#111113] p-2 text-[#a1a1aa] hover:text-[#fafafa] hover:border-[#3f3f46] transition disabled:opacity-50"
              >
                <svg
                  className={`h-4 w-4 ${isLoading ? "animate-spin text-[#22c55e]" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <TableSkeleton rows={7} columns={7} />
          )}

          {/* Error State */}
          {!isLoading && error && (
            <ErrorMessage
              title="Unable to load leaderboard"
              message={error}
              onRetry={fetchLeaderboard}
            />
          )}

          {/* Empty State */}
          {!isLoading && !error && leaderboard.length === 0 && (
            <EmptyState
              icon="🏆"
              title="No Completed Matches Yet"
              description="Be the first to step into the arena! Complete a Tic-Tac-Toe match to claim the #1 spot on the leaderboard."
              action={{
                label: "Play First Match",
                to: "/game",
              }}
            />
          )}

          {/* Leaderboard Table Container */}
          {!isLoading && !error && leaderboard.length > 0 && (
            filteredLeaderboard.length === 0 ? (
              <EmptyState
                icon="🔎"
                title="No players found"
                description={`No leaderboard entries match “${searchQuery}”. Try a different search.`}
              />
            ) : (
            <div className="overflow-hidden rounded-xl border border-[#27272a] bg-[#111113]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#27272a] bg-[#0a0a0b] text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                      <th className="py-4 pl-6 pr-3 text-center w-20">Rank</th>
                      <th className="py-4 px-4">Player</th>
                      <th className="py-4 px-4 text-center">Matches</th>
                      <th className="py-4 px-4 text-center">Wins</th>
                      <th className="py-4 px-4 text-center">Losses</th>
                      <th className="py-4 px-4 text-center">Draws</th>
                      <th className="py-4 pl-4 pr-6 text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a] text-sm">
                    {filteredLeaderboard.map((player) => {
                      const rank = leaderboard.findIndex((p) => p.userId === player.userId) + 1;
                      const isCurrentUser = currentUser?.id === player.userId;

                      return (
                        <tr
                          key={player.userId}
                          className={`transition-colors ${
                            isCurrentUser
                              ? "bg-[#22c55e]/10 border-l-2 border-l-[#22c55e] hover:bg-[#22c55e]/15"
                              : "hover:bg-[#18181b]"
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-4 pl-6 pr-3 text-center font-bold">
                            {rank === 1 ? (
                              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-400 text-xs font-bold">
                                🥇 1
                              </span>
                            ) : rank === 2 ? (
                              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-zinc-500/50 bg-zinc-500/10 text-zinc-300 text-xs font-bold">
                                🥈 2
                              </span>
                            ) : rank === 3 ? (
                              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-amber-700/50 bg-amber-700/10 text-amber-600 text-xs font-bold">
                                🥉 3
                              </span>
                            ) : (
                              <span className="text-[#71717a] text-xs font-mono">#{rank}</span>
                            )}
                          </td>

                          {/* Player Name & Avatar */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                                  rank === 1
                                    ? "border border-amber-500/50 bg-[#18181b] text-amber-400"
                                    : rank === 2
                                    ? "border border-zinc-500/50 bg-[#18181b] text-zinc-300"
                                    : rank === 3
                                    ? "border border-amber-700/50 bg-[#18181b] text-amber-600"
                                    : isCurrentUser
                                    ? "border border-[#22c55e]/50 bg-[#18181b] text-[#22c55e]"
                                    : "border border-[#27272a] bg-[#18181b] text-[#fafafa]"
                                }`}
                              >
                                {player.name ? player.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-bold ${
                                      isCurrentUser
                                        ? "text-[#22c55e]"
                                        : rank === 1
                                        ? "text-amber-400"
                                        : "text-[#fafafa]"
                                    }`}
                                  >
                                    {player.name}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="rounded-full bg-[#22c55e]/20 border border-[#22c55e]/30 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#22c55e]">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#71717a]">ID: #{player.userId}</span>
                              </div>
                            </div>
                          </td>

                          {/* Games Played */}
                          <td className="py-4 px-4 text-center font-semibold text-[#fafafa]">
                            {player.gamesPlayed}
                          </td>

                          {/* Wins */}
                          <td className="py-4 px-4 text-center font-extrabold text-[#22c55e]">
                            {player.wins}
                          </td>

                          {/* Losses */}
                          <td className="py-4 px-4 text-center font-semibold text-rose-400">
                            {player.losses}
                          </td>

                          {/* Draws */}
                          <td className="py-4 px-4 text-center font-medium text-[#71717a]">
                            {player.draws}
                          </td>

                          {/* Win Rate */}
                          <td className="py-4 pl-4 pr-6 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={`font-black ${
                                  player.winRate >= 70
                                    ? "text-[#22c55e]"
                                    : "text-[#fafafa]"
                                }`}
                              >
                                {player.winRate}%
                              </span>
                              <div className="h-1.5 w-20 rounded-full border border-[#27272a] bg-[#18181b] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#22c55e]"
                                  style={{ width: `${Math.min(player.winRate, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredLeaderboard.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-xl">🔍</span>
                            <p className="text-xs text-[#a1a1aa]">
                              No players matching &ldquo;{searchQuery}&rdquo;
                            </p>
                            <button
                              type="button"
                              onClick={() => setSearchQuery("")}
                              className="mt-1 rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-1 text-xs font-semibold text-[#fafafa] hover:bg-[#27272a] transition"
                            >
                              Clear Search
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            )
          )}
        </section>
      </main>
    </div>
  );
}
