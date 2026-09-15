import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAppSelector } from "../redux/hook";
import Navbar from "../components/Navbar";
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
      setError("Unable to load leaderboard standings. Please try again.");
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
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/40 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/10 to-pink-500/10 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
                <span>🏆</span>
                <span>Official PlayHub Rankings</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Global Arena Leaderboard
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Rankings calculated live from completed competitive matches. Rise through the ranks by outsmarting opponents in 1v1 turn-based combat.
              </p>
            </div>

            {/* Quick User Standing Card */}
            {currentUser && (
              <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl backdrop-blur-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-lg font-black text-white shadow-md">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{currentUser.name}</p>
                    <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                      YOU
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentUserRank > 0 ? (
                      <span>
                        Current Rank:{" "}
                        <strong className="text-indigo-400">#{currentUserRank}</strong> of {leaderboard.length}
                      </span>
                    ) : (
                      <span className="text-amber-400/90">Play a match to earn a rank!</span>
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
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>👑 Champions Podium</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* 2nd Place */}
              {topThree[1] && (
                <div
                  className={`order-2 sm:order-1 relative rounded-2xl border p-5 backdrop-blur-md transition-all duration-200 hover:scale-[1.01] ${
                    currentUser?.id === topThree[1].userId
                      ? "border-slate-400/60 bg-gradient-to-b from-slate-800/80 to-slate-900/90 shadow-lg shadow-slate-400/10 ring-2 ring-indigo-500/50"
                      : "border-slate-700/60 bg-gradient-to-b from-slate-900/90 to-slate-950/90"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-300 to-slate-500 text-lg font-black text-slate-950 shadow-md">
                        {topThree[1].name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-100 text-base">{topThree[1].name}</h3>
                          {currentUser?.id === topThree[1].userId && (
                            <span className="rounded bg-indigo-500/30 px-1.5 py-0.2 text-[9px] font-bold text-indigo-300">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{topThree[1].gamesPlayed} Matches</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">🥈</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                        2nd Rank
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-800/60 pt-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Wins</p>
                      <p className="text-sm font-extrabold text-emerald-400">{topThree[1].wins}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Defeats</p>
                      <p className="text-sm font-extrabold text-rose-400">{topThree[1].losses}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Win Rate</p>
                      <p className="text-sm font-extrabold text-cyan-400">{topThree[1].winRate}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place - Crown Champion */}
              {topThree[0] && (
                <div
                  className={`order-1 sm:order-2 relative -mt-0 sm:-mt-3 rounded-2xl border p-6 backdrop-blur-md transition-all duration-200 hover:scale-[1.02] ${
                    currentUser?.id === topThree[0].userId
                      ? "border-amber-400/80 bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-950/90 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400"
                      : "border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-950/90 shadow-xl shadow-amber-500/10"
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-md">
                    👑 Grand Champion
                  </div>

                  <div className="flex items-start justify-between mt-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-300 via-amber-400 to-yellow-500 text-xl font-black text-slate-950 shadow-lg shadow-amber-500/30">
                        {topThree[0].name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-white text-lg">{topThree[0].name}</h3>
                          {currentUser?.id === topThree[0].userId && (
                            <span className="rounded bg-indigo-500/30 px-1.5 py-0.2 text-[9px] font-bold text-indigo-300">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-amber-300/80">{topThree[0].gamesPlayed} Matches</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl">🥇</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                        1st Rank
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-amber-500/20 pt-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Wins</p>
                      <p className="text-base font-black text-emerald-400">{topThree[0].wins}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Defeats</p>
                      <p className="text-base font-black text-rose-400">{topThree[0].losses}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Win Rate</p>
                      <p className="text-base font-black text-amber-300">{topThree[0].winRate}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div
                  className={`order-3 relative rounded-2xl border p-5 backdrop-blur-md transition-all duration-200 hover:scale-[1.01] ${
                    currentUser?.id === topThree[2].userId
                      ? "border-amber-700/70 bg-gradient-to-b from-amber-900/30 to-slate-950/90 shadow-lg shadow-amber-800/10 ring-2 ring-indigo-500/50"
                      : "border-amber-800/40 bg-gradient-to-b from-slate-900/90 to-slate-950/90"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-800 text-lg font-black text-white shadow-md">
                        {topThree[2].name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-100 text-base">{topThree[2].name}</h3>
                          {currentUser?.id === topThree[2].userId && (
                            <span className="rounded bg-indigo-500/30 px-1.5 py-0.2 text-[9px] font-bold text-indigo-300">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{topThree[2].gamesPlayed} Matches</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">🥉</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                        3rd Rank
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-800/60 pt-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Wins</p>
                      <p className="text-sm font-extrabold text-emerald-400">{topThree[2].wins}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Defeats</p>
                      <p className="text-sm font-extrabold text-rose-400">{topThree[2].losses}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Win Rate</p>
                      <p className="text-sm font-extrabold text-cyan-400">{topThree[2].winRate}%</p>
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
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>⚔️ Complete Player Standings</span>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                  {leaderboard.length} {leaderboard.length === 1 ? "Player" : "Players"}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sorted primarily by Victories, followed by Win Rate and total Games Played.
              </p>
            </div>

            {/* Search Input & Action Buttons */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search player name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 sm:w-64 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 pl-9 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-slate-500"
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
                className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition disabled:opacity-50"
              >
                <svg
                  className={`h-4 w-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`}
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
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent"></div>
              <p className="mt-3 text-sm text-slate-400">Loading live arena leaderboard...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
              <span className="text-3xl">⚠️</span>
              <p className="mt-2 text-sm font-semibold text-rose-300">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && leaderboard.length === 0 && (
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-12 text-center space-y-4">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-indigo-500/10 text-3xl">
                🎮
              </div>
              <h3 className="text-lg font-bold text-white">No Completed Matches Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Be the first to step into the arena! Complete a Tic-Tac-Toe match to claim the #1 spot on the leaderboard.
              </p>
              <Link
                to="/game"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition"
              >
                <span>Play First Match</span>
                <span>➔</span>
              </Link>
            </div>
          )}

          {/* Leaderboard Table Container */}
          {!isLoading && !error && leaderboard.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 shadow-xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-4 pl-6 pr-3 text-center w-20">Rank</th>
                      <th className="py-4 px-4">Player</th>
                      <th className="py-4 px-4 text-center">Matches</th>
                      <th className="py-4 px-4 text-center">Wins</th>
                      <th className="py-4 px-4 text-center">Losses</th>
                      <th className="py-4 px-4 text-center">Draws</th>
                      <th className="py-4 pl-4 pr-6 text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {filteredLeaderboard.map((player) => {
                      const rank = leaderboard.findIndex((p) => p.userId === player.userId) + 1;
                      const isCurrentUser = currentUser?.id === player.userId;

                      return (
                        <tr
                          key={player.userId}
                          className={`transition-colors duration-150 ${
                            isCurrentUser
                              ? "bg-indigo-600/15 border-l-4 border-l-indigo-500 hover:bg-indigo-600/25"
                              : rank === 1
                              ? "bg-amber-500/5 hover:bg-amber-500/10"
                              : rank === 2
                              ? "bg-slate-300/5 hover:bg-slate-300/10"
                              : rank === 3
                              ? "bg-amber-700/5 hover:bg-amber-700/10"
                              : "hover:bg-slate-800/50"
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-4 pl-6 pr-3 text-center font-bold">
                            {rank === 1 ? (
                              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20">
                                🥇 1
                              </span>
                            ) : rank === 2 ? (
                              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-950 text-xs font-black shadow-md">
                                🥈 2
                              </span>
                            ) : rank === 3 ? (
                              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 text-white text-xs font-black shadow-md">
                                🥉 3
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs font-mono">#{rank}</span>
                            )}
                          </td>

                          {/* Player Name & Avatar */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black shadow-inner ${
                                  rank === 1
                                    ? "bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-black"
                                    : rank === 2
                                    ? "bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-950"
                                    : rank === 3
                                    ? "bg-gradient-to-tr from-amber-600 to-amber-700 text-white"
                                    : isCurrentUser
                                    ? "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                {player.name ? player.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-bold ${
                                      isCurrentUser
                                        ? "text-indigo-300"
                                        : rank === 1
                                        ? "text-amber-300"
                                        : "text-slate-100"
                                    }`}
                                  >
                                    {player.name}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="rounded-md bg-indigo-500/30 border border-indigo-500/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-indigo-300">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500">ID: #{player.userId}</span>
                              </div>
                            </div>
                          </td>

                          {/* Games Played */}
                          <td className="py-4 px-4 text-center font-semibold text-slate-300">
                            {player.gamesPlayed}
                          </td>

                          {/* Wins */}
                          <td className="py-4 px-4 text-center font-extrabold text-emerald-400">
                            {player.wins}
                          </td>

                          {/* Losses */}
                          <td className="py-4 px-4 text-center font-semibold text-rose-400">
                            {player.losses}
                          </td>

                          {/* Draws */}
                          <td className="py-4 px-4 text-center font-medium text-slate-400">
                            {player.draws}
                          </td>

                          {/* Win Rate */}
                          <td className="py-4 pl-4 pr-6 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={`font-black ${
                                  player.winRate >= 70
                                    ? "text-emerald-400"
                                    : player.winRate >= 45
                                    ? "text-cyan-400"
                                    : "text-slate-300"
                                }`}
                              >
                                {player.winRate}%
                              </span>
                              <div className="h-1.5 w-20 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    player.winRate >= 70
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                      : player.winRate >= 45
                                      ? "bg-gradient-to-r from-indigo-500 to-cyan-400"
                                      : "bg-gradient-to-r from-slate-600 to-slate-400"
                                  }`}
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
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                          No players matching "{searchQuery}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
