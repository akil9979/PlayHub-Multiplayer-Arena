import type { GameStats } from "../types/game";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAppSelector } from "../redux/hook";
import Navbar from "../components/Navbar";

function Profile() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await api.get("/users/stats");
        setStats(result.data);
      } catch (error) {
        console.error("Failed to fetch game statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
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
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8 rounded-2xl bg-slate-900 p-6 shadow-xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-700 text-3xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="mt-1 text-slate-400">{user.email}</p>
              <p className="mt-2 text-sm text-slate-500">
                Member since{" "}
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h2 className="mb-4 text-2xl font-bold">Game Statistics</h2>

          {isLoading ? (
            <div className="rounded-xl bg-slate-900 p-6 text-center text-slate-400">
              Loading statistics...
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl bg-slate-800 p-5 text-center shadow-lg">
                  <p className="text-sm text-slate-400">Games Played</p>
                  <p className="mt-2 text-3xl font-bold">
                    {stats.games_played}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-800 p-5 text-center shadow-lg">
                  <p className="text-sm text-slate-400">Wins</p>
                  <p className="mt-2 text-3xl font-bold text-green-400">
                    {stats.wins}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-800 p-5 text-center shadow-lg">
                  <p className="text-sm text-slate-400">Losses</p>
                  <p className="mt-2 text-3xl font-bold text-red-400">
                    {stats.losses}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-800 p-5 text-center shadow-lg">
                  <p className="text-sm text-slate-400">Draws</p>
                  <p className="mt-2 text-3xl font-bold text-yellow-400">
                    {stats.draws}
                  </p>
                </div>
              </div>

              {/* Win Rate */}
              <div className="mt-6 rounded-xl bg-slate-900 p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Win Rate</p>
                    <p className="mt-1 text-4xl font-bold">
                      {winRate.toFixed(1)}%
                    </p>
                  </div>

                  <div className="text-5xl">🏆</div>
                </div>

                <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-green-400 transition-all duration-500"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl bg-slate-900 p-6 text-center text-slate-400">
              Unable to load game statistics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;