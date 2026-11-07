import type { GameHistory, GameStats } from "../types/game";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Mail, Medal, Trophy } from "lucide-react";
import api from "../api/axios";
import { useAppSelector } from "../redux/hook";
import Navbar from "../components/Navbar";
import GameHistoryComponent from "../components/GameHistory";
import ErrorMessage from "../components/common/ErrorMessage";
import { StatsGridSkeleton, TableSkeleton } from "../components/common/Skeletons";
import { BackButton } from "../components/ui/BackButton";
import { getErrorMessage } from "../utils/apiError";

function Profile() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const navigate = useNavigate();
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] text-white">
        <p>User information not available.</p>
      </div>
    );
  }

  return (
    <div className="page-shell flex flex-col">
      <Navbar variant="authenticated" />
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        {/* Back navigation */}
        <div>
          <BackButton onClick={() => navigate("/dashboard")} />
        </div>

        {/* Profile Header */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121217] p-6 sm:p-8 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
            aria-hidden
          />

          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950/30 text-3xl font-black text-accent shadow-inner">
              {user.name.charAt(0).toUpperCase()}
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#121217] bg-emerald-500 shadow-sm" />
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-white sm:text-3xl font-display truncate">
                  {user.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-xs font-semibold text-accent backdrop-blur-sm select-none">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span>Online</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Career Statistics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white font-display">
                Career Statistics
              </h2>
              <p className="text-xs text-zinc-400">Lifetime match record and performance</p>
            </div>
          </div>

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
              <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-4">
                <div className="surface-card p-5 text-center transition-all hover:border-zinc-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Games Played
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-white font-mono tabular-nums">
                    {stats.games_played}
                  </p>
                </div>

                <div className="surface-card border-emerald-500/30 bg-emerald-950/10 p-5 text-center transition-all hover:border-emerald-500/50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Wins
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-accent font-mono tabular-nums">
                    {stats.wins}
                  </p>
                </div>

                <div className="surface-card border-rose-500/30 bg-rose-950/10 p-5 text-center transition-all hover:border-rose-500/50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                    Losses
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-rose-400 font-mono tabular-nums">
                    {stats.losses}
                  </p>
                </div>

                <div className="surface-card p-5 text-center transition-all hover:border-zinc-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Draws
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-zinc-200 font-mono tabular-nums">
                    {stats.draws}
                  </p>
                </div>
              </div>

              {/* Win Rate Card */}
              <div className="surface-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                      Overall Win Rate
                    </p>
                    <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">
                      {winRate.toFixed(1)}%
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-1.5 font-display text-xs font-bold tracking-wider text-amber-300">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>
                      {winRate >= 70 && stats.games_played >= 5
                        ? "GRANDMASTER"
                        : winRate >= 50 && stats.games_played >= 3
                        ? "VETERAN"
                        : "CHALLENGER"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 h-2 w-full overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    style={{ width: `${Math.min(winRate, 100)}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="surface-card p-6 text-center text-zinc-500">
              No statistics available yet. Play a match to start your record!
            </div>
          )}
        </div>

        {/* Match History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white font-display">
                Match History
              </h2>
              <p className="text-xs text-zinc-400">
                Detailed record of all your multiplayer matches
              </p>
            </div>
            {gameHistory.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs font-semibold text-zinc-300">
                <Medal className="w-3.5 h-3.5 text-accent" />
                <span>{gameHistory.length} Matches</span>
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
