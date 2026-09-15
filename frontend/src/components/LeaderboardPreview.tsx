import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAppSelector } from "../redux/hook";
import type { LeaderboardEntry } from "../types/game";

export default function LeaderboardPreview() {
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    let isMounted = true;
    const fetchTopLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.get("/users/leaderboard");
        if (isMounted) {
          const data: LeaderboardEntry[] = Array.isArray(res.data) ? res.data : [];
          setTopPlayers(data.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load leaderboard preview:", err);
        if (isMounted) {
          setError("Failed to load rankings");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTopLeaderboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-7 shadow-xl backdrop-blur-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 text-base border border-amber-500/30">
              🏆
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight flex items-center gap-1.5">
                <span>Leaderboard Standings</span>
              </h3>
              <p className="text-[11px] text-slate-400">Top Arena Competitors</p>
            </div>
          </div>
          <Link
            to="/leaderboard"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition flex items-center gap-1"
          >
            <span>Full Board</span>
            <span>→</span>
          </Link>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2.5">
          {isLoading ? (
            <div className="py-8 text-center space-y-2">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              <p className="text-[11px] text-slate-400">Loading top contenders...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <p className="text-xs text-rose-400">{error}</p>
            </div>
          ) : topPlayers.length === 0 ? (
            <div className="py-6 text-center space-y-1 text-slate-400">
              <p className="text-xs">No matches recorded yet.</p>
              <p className="text-[10px] text-slate-500">Play a match to claim #1!</p>
            </div>
          ) : (
            topPlayers.map((player, index) => {
              const rank = index + 1;
              const isCurrentUser = currentUser?.id === player.userId;

              return (
                <div
                  key={player.userId}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                    isCurrentUser
                      ? "bg-indigo-600/20 border border-indigo-500/40"
                      : rank === 1
                      ? "bg-amber-500/10 border border-amber-500/20"
                      : rank === 2
                      ? "bg-slate-300/5 border border-slate-700/40"
                      : rank === 3
                      ? "bg-amber-700/10 border border-amber-800/30"
                      : "bg-slate-950/40 border border-slate-800/40 hover:bg-slate-800/30"
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
                        <span className="text-slate-400 font-mono text-[11px]">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar Initial */}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black ${
                        rank === 1
                          ? "bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-black"
                          : rank === 2
                          ? "bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-950"
                          : rank === 3
                          ? "bg-gradient-to-tr from-amber-600 to-amber-700 text-white"
                          : isCurrentUser
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {player.name ? player.name.charAt(0).toUpperCase() : "U"}
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-1.5 truncate max-w-[110px] sm:max-w-[130px]">
                      <span
                        className={`truncate font-semibold ${
                          isCurrentUser
                            ? "text-indigo-300"
                            : rank === 1
                            ? "text-amber-300"
                            : "text-slate-200"
                        }`}
                      >
                        {player.name}
                      </span>
                      {isCurrentUser && (
                        <span className="rounded bg-indigo-500/30 px-1 py-0.2 text-[8px] font-black uppercase text-indigo-300">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats Column */}
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="font-extrabold text-emerald-400">{player.wins}W</span>
                      <span className="text-slate-500 mx-1">•</span>
                      <span className="text-slate-400">{player.gamesPlayed}M</span>
                    </div>
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        player.winRate >= 60 ? "text-cyan-400" : "text-slate-300"
                      }`}
                    >
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
      <div className="mt-5 pt-3 border-t border-slate-800/80">
        <Link
          to="/leaderboard"
          className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-600/10 py-2.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-600/20 hover:text-white"
        >
          <span>View Full Leaderboard</span>
          <span>➔</span>
        </Link>
      </div>
    </div>
  );
}
