import { useEffect, useState } from "react";
import { Crown, Medal, RefreshCw, Search, Trophy } from "lucide-react";
import api from "../api/axios";
import { useAppSelector } from "../redux/hook";
import Navbar from "../components/Navbar";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "./../components/common/EmptyState";
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
        <section className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-[#121217] via-[#101014] to-[#0c0c0f] p-6 sm:p-10 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl"
            aria-hidden
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur-sm select-none">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Official PlayHub Rankings</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-display">
                Global Arena Leaderboard
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                Rankings calculated live from completed competitive matches. Rise through the ranks by outsmarting opponents in 1v1 turn-based combat.
              </p>
            </div>

            {/* Quick User Standing Card */}
            {currentUser && (
              <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-[#0d0d10] p-4 shadow-inner">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-lg font-black text-accent">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{currentUser.name}</p>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent">
                      YOU
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                    {currentUserRank > 0 ? (
                      <span>
                        Current Rank:{" "}
                        <strong className="text-accent font-mono">#{currentUserRank}</strong> of {leaderboard.length}
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
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 font-display">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>Champions Podium</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* 2nd Place */}
              {topThree[1] && (
                <div
                  className={`order-2 sm:order-1 relative rounded-2xl border border-zinc-700/60 bg-[#121217] p-5 transition-all shadow-sm ${
                    currentUser?.id === topThree[1].userId ? "ring-2 ring-accent" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-800 text-lg font-black text-zinc-200 shadow-inner">
                        {topThree[1].name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-white text-base font-display">{topThree[1].name}</h3>
                          {currentUser?.id === topThree[1].userId && (
                            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-accent">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400">{topThree[1].gamesPlayed} Matches</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">🥈</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                        2nd Rank
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-800/80 pt-3 text-center font-mono tabular-nums">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">Wins</p>
                      <p className="text-sm font-extrabold text-accent">{topThree[1].wins}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">Defeats</p>
                      <p className="text-sm font-extrabold text-rose-400">{topThree[1].losses}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">Win Rate</p>
                      <p className="text-sm font-extrabold text-white">{topThree[1].winRate}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place - Grand Champion */}
              {topThree[0] && (
                <div
                  className={`order-1 sm:order-2 relative -mt-0 sm:-mt-3 rounded-2xl border border-amber-500/50 bg-[#14141a] p-6 transition-all shadow-[0_12px_40px_-8px_rgba(245,158,11,0.2)] ${
                    currentUser?.id === topThree[0].userId ? "ring-2 ring-accent" : ""
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-950/80 backdrop-blur-sm px-3.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 shadow-sm flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Grand Champion</span>
                  </div>

                  <div className="flex items-start justify-between mt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/60 bg-amber-500/10 text-xl font-black text-amber-300 shadow-inner">
                        {topThree[0].name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-white text-lg font-display">{topThree[0].name}</h3>
                          {currentUser?.id === topThree[0].userId && (
                            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-accent">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-amber-400/90 font-medium">{topThree[0].gamesPlayed} Matches</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl">🥇</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                        1st Rank
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-800/80 pt-3 text-center font-mono tabular-nums">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">Wins</p>
                      <p className="text-base font-black text-accent">{topThree[0].wins}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">Defeats</p>
                      <p className="text-base font-black text-rose-400">{topThree[0].losses}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">Win Rate</p>
                      <p className="text-base font-black text-amber-300">{topThree[0].winRate}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div
                  className={`order-3 relative rounded-2xl border border-amber-800/50 bg-[#121217] p-5 transition-all shadow-sm ${
                    currentUser?.id === topThree[2].userId ? "ring-2 ring-accent" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-800 bg-zinc-850 text-lg font-black text-amber-500 shadow-inner">
                        {topThree[2].name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-white text-base font-display">{topThree[2].name}</h3>
                          {currentUser?.id === topThree[2].userId && (
                            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-accent">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400">{topThree[2].gamesPlayed} Matches</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">🥉</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                        3rd Rank
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-800/80 pt-3 text-center font-mono tabular-nums">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">Wins</p>
                      <p className="text-sm font-extrabold text-accent">{topThree[2].wins}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">Defeats</p>
                      <p className="text-sm font-extrabold text-rose-400">{topThree[2].losses}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans">Win Rate</p>
                      <p className="text-sm font-extrabold text-white">{topThree[2].winRate}%</p>
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
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-display">
                <Medal className="w-5 h-5 text-accent" />
                <span>Complete Player Standings</span>
                <span className="rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-0.5 text-xs font-semibold text-zinc-400">
                  {leaderboard.length} {leaderboard.length === 1 ? "Player" : "Players"}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
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
                  className="w-48 sm:w-64 rounded-xl border border-zinc-800 bg-[#121217] py-2 pr-3.5 text-xs text-white placeholder-zinc-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  style={{ paddingLeft: "2.5rem" }}
                />
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              </div>

              <button
                type="button"
                onClick={fetchLeaderboard}
                disabled={isLoading}
                title="Refresh Standings"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-[#121217] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-accent" : ""}`} />
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
              icon={<Trophy className="w-6 h-6 text-zinc-500" />}
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
                icon={<Search className="w-6 h-6 text-zinc-500" />}
                title="No players found"
                description={`No leaderboard entries match “${searchQuery}”. Try a different search.`}
              />
            ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121217] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-[#0d0d10] text-[11px] font-bold uppercase tracking-wider text-zinc-400 select-none">
                      <th className="py-4 pl-6 pr-3 text-center w-20">Rank</th>
                      <th className="py-4 px-4">Player</th>
                      <th className="py-4 px-4 text-center">Matches</th>
                      <th className="py-4 px-4 text-center">Wins</th>
                      <th className="py-4 px-4 text-center">Losses</th>
                      <th className="py-4 px-4 text-center">Draws</th>
                      <th className="py-4 pl-4 pr-6 text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-sm font-mono tabular-nums">
                    {filteredLeaderboard.map((player) => {
                      const rank = leaderboard.findIndex((p) => p.userId === player.userId) + 1;
                      const isCurrentUser = currentUser?.id === player.userId;

                      return (
                        <tr
                          key={player.userId}
                          className={`transition-colors ${
                            isCurrentUser
                              ? "bg-emerald-950/20 border-l-2 border-l-accent hover:bg-emerald-950/30"
                              : "hover:bg-zinc-850/40"
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-4 pl-6 pr-3 text-center font-bold">
                            {rank === 1 ? (
                              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-amber-500/50 bg-amber-950/40 text-amber-300 text-xs font-bold">
                                🥇 1
                              </span>
                            ) : rank === 2 ? (
                              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-zinc-600 bg-zinc-800 text-zinc-200 text-xs font-bold">
                                🥈 2
                              </span>
                            ) : rank === 3 ? (
                              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-amber-800 bg-amber-950/40 text-amber-500 text-xs font-bold">
                                🥉 3
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-xs">#{rank}</span>
                            )}
                          </td>

                          {/* Player Name & Avatar */}
                          <td className="py-4 px-4 font-sans">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                                  rank === 1
                                    ? "border border-amber-500/50 bg-amber-950/30 text-amber-300"
                                    : rank === 2
                                    ? "border border-zinc-600 bg-zinc-800 text-zinc-200"
                                    : rank === 3
                                    ? "border border-amber-800 bg-amber-950/30 text-amber-500"
                                    : isCurrentUser
                                    ? "border border-emerald-500/50 bg-emerald-950/30 text-accent"
                                    : "border border-zinc-800 bg-zinc-850 text-white"
                                }`}
                              >
                                {player.name ? player.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-bold ${
                                      isCurrentUser
                                        ? "text-accent"
                                        : rank === 1
                                        ? "text-amber-300"
                                        : "text-white"
                                    }`}
                                  >
                                    {player.name}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-accent">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono">ID: #{player.userId}</span>
                              </div>
                            </div>
                          </td>

                          {/* Games Played */}
                          <td className="py-4 px-4 text-center font-semibold text-white">
                            {player.gamesPlayed}
                          </td>

                          {/* Wins */}
                          <td className="py-4 px-4 text-center font-extrabold text-accent">
                            {player.wins}
                          </td>

                          {/* Losses */}
                          <td className="py-4 px-4 text-center font-semibold text-rose-400">
                            {player.losses}
                          </td>

                          {/* Draws */}
                          <td className="py-4 px-4 text-center font-medium text-zinc-500">
                            {player.draws}
                          </td>

                          {/* Win Rate */}
                          <td className="py-4 pl-4 pr-6 text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              <span
                                className={`font-black ${
                                  player.winRate >= 70
                                    ? "text-accent"
                                    : "text-white"
                                }`}
                              >
                                {player.winRate}%
                              </span>
                              <div className="h-1.5 w-20 rounded-full border border-zinc-800 bg-zinc-900 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-accent shadow-[0_0_6px_rgba(34,197,94,0.5)]"
                                  style={{ width: `${Math.min(player.winRate, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredLeaderboard.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center font-sans">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Search className="h-6 w-6 text-zinc-500" />
                            <p className="text-xs text-zinc-400">
                              No players matching &ldquo;{searchQuery}&rdquo;
                            </p>
                            <button
                              type="button"
                              onClick={() => setSearchQuery("")}
                              className="mt-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors cursor-pointer"
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
