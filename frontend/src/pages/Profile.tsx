import type { GameHistory, GameStats } from "../types/game";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAppSelector } from "../redux/hook";
import Navbar from "../components/Navbar";
import GameHistoryComponent from "../components/GameHistory";

function Profile() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    let isMounted = true;

    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const [statsRes, historyRes] = await Promise.allSettled([
          api.get("/users/stats"),
          api.get("/games/history"),
        ]);

        if (isMounted) {
          if (statsRes.status === "fulfilled") {
            setStats(statsRes.value.data);
          }
          if (historyRes.status === "fulfilled") {
            setGameHistory(historyRes.value.data || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, []);

  const winRate =
    stats && stats.games_played > 0
      ? (stats.wins / stats.games_played) * 100
      : 0;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p>User information not available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 w-full flex-1 space-y-8">
        {/* Profile Header */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-3xl font-extrabold shadow-lg shadow-indigo-500/25">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold">{user.name}</h1>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  ● Online
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{user.email}</p>
              <p className="mt-2 text-xs text-slate-500">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>📊 Career Statistics</span>
          </h2>

          {isLoading ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center text-slate-400">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              <p className="mt-2 text-xs">Loading statistics...</p>
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 text-center shadow-lg backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Games Played
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {stats.games_played}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-5 text-center shadow-lg backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Wins
                  </p>
                  <p className="mt-2 text-3xl font-bold text-green-400">
                    {stats.wins}
                  </p>
                </div>

                <div className="rounded-2xl border border-rose-500/20 bg-slate-900/60 p-5 text-center shadow-lg backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                    Losses
                  </p>
                  <p className="mt-2 text-3xl font-bold text-red-400">
                    {stats.losses}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-slate-900/60 p-5 text-center shadow-lg backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Draws
                  </p>
                  <p className="mt-2 text-3xl font-bold text-yellow-400">
                    {stats.draws}
                  </p>
                </div>
              </div>

              {/* Win Rate */}
              <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Win Rate
                    </p>
                    <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-indigo-300">
                      {winRate.toFixed(1)}%
                    </p>
                  </div>

                  <div className="text-4xl sm:text-5xl">🏆</div>
                </div>

                <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 text-center text-slate-400">
              Unable to load game statistics.
            </div>
          )}
        </div>

        {/* Match History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>⚔️ Match History</span>
              </h2>
              <p className="text-xs text-slate-400">
                Detailed record of all your multiplayer matches
              </p>
            </div>
            {gameHistory.length > 0 && (
              <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                {gameHistory.length} Matches
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center text-slate-400">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              <p className="mt-2 text-xs">Loading match history...</p>
            </div>
          ) : (
            <GameHistoryComponent games={gameHistory} userId={user.id} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;