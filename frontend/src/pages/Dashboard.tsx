import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../redux/hook";
import api from "../api/axios";
import { socket } from "../Socket";
import Navbar from "../components/Navbar";
import OnlinePlayers from "../components/OnlinePlayers";
import LeaderboardPreview from "../components/LeaderboardPreview";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getErrorMessage } from "../utils/apiError";
import type { GameStats, OnlineUser } from "../types/game";

interface ComingSoonGame {
  id: string;
  title: string;
  category: string;
  players: string;
  iconLabel: string;
  description: string;
}

const UPCOMING_GAMES: ComingSoonGame[] = [
  {
    id: "connect-4",
    title: "Connect Four",
    category: "Strategy",
    players: "1v1 Online",
    iconLabel: "C4",
    description: "Drop tokens into the grid and align 4 in a row before your rival does.",
  },
  {
    id: "chess",
    title: "Chess",
    category: "Grandmaster",
    players: "1v1 Online",
    iconLabel: "CH",
    description: "Timed multiplayer chess matches with ranked ladders on the way.",
  },
  {
    id: "battleship",
    title: "Battleship",
    category: "Tactical Grid",
    players: "1v1 Online",
    iconLabel: "BS",
    description: "Secretly position your naval fleet and target enemy coordinates.",
  },
  {
    id: "rps",
    title: "Rock Paper Scissors",
    category: "Speed Battle",
    players: "1v1 Instant",
    iconLabel: "RPS",
    description: "Rapid best-of-5 duels with instant round resolution.",
  },
];

const FEATURE_PILLS = [
  "Real-time multiplayer",
  "Private room / challenge",
  "Rematch support",
  "Match history",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [stats, setStats] = useState<GameStats | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isOnlineLoading, setIsOnlineLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setStatsError(null);
      const statsRes = await api.get("/users/stats");
      setStats(statsRes.data || null);
    } catch (error) {
      console.error("Failed to load user stats:", error);
      setStatsError(
        getErrorMessage(error, "Failed to load player performance stats.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const handleOnlineUsers = (users: OnlineUser[]) => {
      setOnlineUsers(users);
      setIsOnlineLoading(false);
    };

    const handleConnect = () => socket.emit("get-online-users");
    const handleDisconnect = () => setIsOnlineLoading(false);

    socket.on("online-users", handleOnlineUsers);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      socket.emit("get-online-users");
    }

    return () => {
      socket.off("online-users", handleOnlineUsers);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  const totalGames = stats ? stats.games_played : 0;
  const wins = stats ? stats.wins : 0;
  const losses = stats ? stats.losses : 0;
  const draws = stats ? stats.draws : 0;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

  const getRankBadge = () => {
    if (totalGames === 0) return { title: "Unranked", color: "text-[#71717a]" };
    if (winRate >= 70 && totalGames >= 5)
      return { title: "Grandmaster", color: "text-amber-400" };
    if (winRate >= 50 && totalGames >= 3)
      return { title: "Veteran Tactician", color: "text-[#22c55e]" };
    return { title: "Challenger", color: "text-[#22c55e]" };
  };

  const rank = getRankBadge();

  return (
    <div className="page-shell flex flex-col">
      <Navbar variant="authenticated" />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        {/* 1. Welcome / Hero */}
        <section className="relative overflow-hidden rounded-xl border border-[#27272a] bg-[#111113] p-6 sm:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold text-[#22c55e]">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
                  Arena Online
                </span>
                <span className="rounded-full border border-[#27272a] bg-[#18181b] px-3 py-1 text-xs font-medium text-[#a1a1aa]">
                  Rank: <strong className={rank.color}>{rank.title}</strong>
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[#fafafa] sm:text-4xl lg:text-5xl">
                Welcome back, {user?.name || "Player"}
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-[#a1a1aa] sm:text-base">
                Play live games now, challenge online rivals, and track your performance
                as new titles join the arena.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/game" className="btn-primary px-6 py-3.5">
                Play Now
              </Link>
              <Link to="/profile" className="btn-secondary px-5 py-3.5">
                My Profile
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Player performance statistics */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-[#fafafa]">
              Your Performance
            </h2>
            <Link
              to="/profile"
              className="text-xs font-semibold text-[#fafafa] hover:underline"
            >
              Full stats & history →
            </Link>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : statsError ? (
            <ErrorMessage
              title="Unable to load performance statistics"
              message={statsError}
              onRetry={fetchDashboardStats}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              <div className="surface-card p-4 transition sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#71717a]">
                  Matches
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#fafafa] sm:text-3xl">
                  {totalGames}
                </p>
                <p className="mt-1 text-[11px] text-[#71717a]">Games played</p>
              </div>

              <div className="surface-card border-[#22c55e]/30 p-4 transition sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#22c55e]">
                  Victories
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#22c55e] sm:text-3xl">
                  {wins}
                </p>
                <p className="mt-1 text-[11px] text-[#22c55e]/80">Wins</p>
              </div>

              <div className="surface-card border-rose-500/30 p-4 transition sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Defeats
                </p>
                <p className="mt-2 text-2xl font-extrabold text-rose-400 sm:text-3xl">
                  {losses}
                </p>
                <p className="mt-1 text-[11px] text-rose-500/80">Losses</p>
              </div>

              <div className="surface-card border-[#3f3f46] p-4 transition sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">
                  Draws
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#fafafa] sm:text-3xl">
                  {draws}
                </p>
                <p className="mt-1 text-[11px] text-[#71717a]">Stalemates</p>
              </div>

              <div className="col-span-2 surface-card border-[#27272a] p-4 transition sm:col-span-3 sm:p-5 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#22c55e]">
                  Win Rate
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#fafafa] sm:text-3xl">
                  {`${winRate.toFixed(1)}%`}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full border border-[#27272a] bg-[#18181b]">
                  <div
                    className="h-full rounded-full bg-[#22c55e] transition-all duration-500"
                    style={{ width: `${Math.min(winRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. Featured playable game */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#fafafa]">
              Playable Now
            </h2>
            <p className="mt-1 text-sm text-[#a1a1aa]">
              Jump into the featured live game — more titles are listed below as Coming Soon.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-[#27272a] bg-[#111113] p-6 sm:p-8">
            <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-[#3f3f46] bg-[#18181b] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#fafafa]">
                    Featured Game
                  </span>
                  <span className="rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-2.5 py-0.5 text-xs font-semibold text-[#22c55e]">
                    Available
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black tracking-tight text-[#fafafa] sm:text-3xl">
                    Tic-Tac-Toe Arena
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#a1a1aa]">
                    Challenge friends with private room codes or send an invite from the
                    online players list. Every match syncs in real time with rematch and
                    history tracking.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {FEATURE_PILLS.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-lg border border-[#27272a] bg-[#18181b] px-2.5 py-1 text-xs text-[#a1a1aa]"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => navigate("/game")}
                    className="btn-primary px-7 py-4 text-base"
                  >
                    Play Now
                  </button>
                </div>
              </div>

              <div className="flex justify-center md:justify-end">
                <div className="relative rounded-xl border border-[#27272a] bg-[#0a0a0b] p-4">
                  <div className="grid h-48 w-48 grid-cols-3 gap-2">
                    <div className="flex items-center justify-center rounded-lg border border-[#27272a] bg-[#111113] text-2xl font-black text-[#5ab0e6]">
                      O
                    </div>
                    <div className="flex items-center justify-center rounded-lg border border-[#27272a] bg-[#111113] text-2xl font-black text-[#7c6ee6]">
                      X
                    </div>
                    <div className="rounded-lg border border-[#27272a]/50 bg-[#111113]/50" />
                    <div className="rounded-lg border border-[#27272a]/50 bg-[#111113]/50" />
                    <div className="flex items-center justify-center rounded-lg border border-[#22c55e] bg-[#111113] text-2xl font-black text-[#5ab0e6]">
                      O
                    </div>
                    <div className="flex items-center justify-center rounded-lg border border-[#27272a] bg-[#111113] text-2xl font-black text-[#7c6ee6]">
                      X
                    </div>
                    <div className="flex items-center justify-center rounded-lg border border-[#27272a] bg-[#111113] text-2xl font-black text-[#7c6ee6]">
                      X
                    </div>
                    <div className="rounded-lg border border-[#27272a]/50 bg-[#111113]/50" />
                    <div className="flex items-center justify-center rounded-lg border border-[#27272a] bg-[#111113] text-2xl font-black text-[#5ab0e6]">
                      O
                    </div>
                  </div>
                  <p className="mt-3 text-center font-mono text-[11px] text-[#71717a]">
                    LIVE ARENA • 1v1 MATCH
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Online players / challenge system */}
        <OnlinePlayers
          onlineUsers={onlineUsers}
          currentUserId={user?.id}
          isLoading={isOnlineLoading}
        />

        {/* 5. Upcoming games */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#fafafa]">
                Coming Soon
              </h2>
              <p className="mt-1 text-sm text-[#a1a1aa]">
                Games you can look forward to — not playable yet.
              </p>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              Not available yet
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {UPCOMING_GAMES.map((game) => (
              <article
                key={game.id}
                className="surface-card flex flex-col justify-between overflow-hidden p-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#27272a] bg-[#18181b] font-display text-xs font-bold text-[#fafafa]">
                      {game.iconLabel}
                    </div>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                      Coming Soon
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#fafafa]">
                      {game.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#a1a1aa]">
                      {game.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#27272a] pt-3 text-xs text-[#71717a]">
                  <span>{game.players}</span>
                  <span className="font-medium text-[#a1a1aa]">{game.category}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 6. Platform info — compact leaderboard preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-[#fafafa]">
              Arena Standings
            </h2>
          </div>
          <LeaderboardPreview />
        </section>
      </main>

      <footer className="mt-auto border-t border-[#27272a] bg-[#0a0a0b] py-6 text-center text-xs text-[#71717a]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold tracking-wider text-[#fafafa]">
              PLAYHUB
            </span>
            <span>• Multiplayer Arena</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/dashboard" className="text-[#71717a] hover:text-[#fafafa]">
              Dashboard
            </Link>
            <Link to="/game" className="text-[#71717a] hover:text-[#fafafa]">
              Play Game
            </Link>
            <Link to="/leaderboard" className="text-[#71717a] hover:text-[#fafafa]">
              Leaderboard
            </Link>
            <Link to="/profile" className="text-[#71717a] hover:text-[#fafafa]">
              Profile
            </Link>
          </div>

          <p>© {new Date().getFullYear()} PlayHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
