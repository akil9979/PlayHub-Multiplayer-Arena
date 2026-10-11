import type { GameHistory, GameStats } from "../types/game";
import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useAppSelector } from "../redux/hook";
import Navbar from "../components/Navbar";
import GameHistoryComponent from "../components/GameHistory";
import ErrorMessage from "../components/common/ErrorMessage";
import { StatsGridSkeleton, TableSkeleton } from "../components/common/Skeletons";
import { getErrorMessage } from "../utils/apiError";

function Profile() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const user = useAppSelector((state) => state.auth.user);

  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      setStatsError(null);
      const res = await api.get("/users/stats");
      setStats(res.data || null);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setStatsError(getErrorMessage(err, "Unable to load career statistics."));
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      setHistoryError(null);
      const res = await api.get("/games/history");
      setGameHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setHistoryError(getErrorMessage(err, "Unable to load match history."));
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, [fetchStats, fetchHistory]);

  const winRate =
    stats && stats.games_played > 0
      ? (stats.wins / stats.games_played) * 100
      : 0;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] text-[#fafafa]">
        <p>User information not available.</p>
      </div>
    );
  }

  return (
    <div className="page-shell flex flex-col">
      <Navbar variant="authenticated" />
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-8">
        {/* Profile Header */}
        <div className="surface-card-lg p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-[#3f3f46] bg-[#18181b] text-3xl font-extrabold text-[#fafafa]">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-[#fafafa] sm:text-3xl">{user.name}</h1>
                <span className="rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-2.5 py-0.5 text-xs font-semibold text-[#22c55e]">
                  Online
                </span>
              </div>
              <p className="mt-1 text-sm text-[#a1a1aa]">{user.email}</p>
              <p className="mt-2 text-xs text-[#71717a]">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#fafafa]">
            Career Statistics
          </h2>

          {isStatsLoading ? (
            <StatsGridSkeleton count={4} columns="grid-cols-2 md:grid-cols-4" />
          ) : statsError ? (
            <ErrorMessage
              title="Unable to load career statistics"
              message={statsError}
              onRetry={fetchStats}
            />
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-[#27272a] bg-[#111113] p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#71717a]">
                    Games Played
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#fafafa]">
                    {stats.games_played}
                  </p>
                </div>

                <div className="rounded-xl border border-[#22c55e]/30 bg-[#111113] p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#22c55e]">
                    Wins
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#22c55e]">
                    {stats.wins}
                  </p>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-[#111113] p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                    Losses
                  </p>
                  <p className="mt-2 text-3xl font-bold text-rose-400">
                    {stats.losses}
                  </p>
                </div>

                <div className="rounded-xl border border-[#3f3f46] bg-[#111113] p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">
                    Draws
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#fafafa]">
                    {stats.draws}
                  </p>
                </div>
              </div>

              {/* Win Rate */}
              <div className="rounded-xl border border-[#27272a] bg-[#111113] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#22c55e]">
                      Win Rate
                    </p>
                    <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-[#fafafa]">
                      {winRate.toFixed(1)}%
                    </p>
                  </div>

                  <div className="font-display text-sm font-bold tracking-wider text-amber-400">
                    RANK
                  </div>
                </div>

                <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full border border-[#27272a] bg-[#18181b]">
                  <div
                    className="h-full rounded-full bg-[#22c55e] transition-all duration-500"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-[#27272a] bg-[#111113] p-6 text-center text-[#71717a]">
              No statistics available yet. Play a match to start your record!
            </div>
          )}
        </div>

        {/* Match History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#fafafa]">
                Match History
              </h2>
              <p className="text-xs text-[#a1a1aa]">
                Detailed record of all your multiplayer matches
              </p>
            </div>
            {gameHistory.length > 0 && (
              <span className="rounded-full border border-[#27272a] bg-[#18181b] px-3 py-1 text-xs font-semibold text-[#a1a1aa]">
                {gameHistory.length} Matches
              </span>
            )}
          </div>

          {isHistoryLoading ? (
            <TableSkeleton rows={4} columns={5} />
          ) : historyError ? (
            <ErrorMessage
              title="Unable to load match history"
              message={historyError}
              onRetry={fetchHistory}
            />
          ) : (
            <GameHistoryComponent games={gameHistory} userId={user.id} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;