import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Flame,
  Gamepad2,
  Medal,
  Play,
  ShieldAlert,
  Sparkles,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import { useAppSelector } from "../redux/hook";
import api from "../api/axios";
import { socket } from "../Socket";
import Navbar from "../components/Navbar";
import OnlinePlayers from "../components/OnlinePlayers";
import LeaderboardPreview from "../components/LeaderboardPreview";
import ErrorMessage from "../components/common/ErrorMessage";
import { StatsGridSkeleton } from "../components/common/Skeletons";
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
    if (totalGames === 0) return { title: "Unranked", color: "text-zinc-500", icon: ShieldAlert };
    if (winRate >= 70 && totalGames >= 5)
      return { title: "Grandmaster", color: "text-amber-400", icon: Trophy };
    if (winRate >= 50 && totalGames >= 3)
      return { title: "Veteran Tactician", color: "text-accent", icon: Medal };
    return { title: "Challenger", color: "text-accent", icon: Flame };
  };

  const rank = getRankBadge();
  const RankIcon = rank.icon;

  return (
    <div className="page-shell flex flex-col">
      <Navbar variant="authenticated" />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        {/* 1. Welcome / Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-[#121217] via-[#101014] to-[#0c0c0f] p-6 sm:p-8 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]">
          {/* Subtle ambient light */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
            aria-hidden
          />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-accent backdrop-blur-sm shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span>Arena Online</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-850 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-300">
                  <RankIcon className={`w-3.5 h-3.5 ${rank.color}`} />
                  <span>
                    Rank: <strong className={rank.color}>{rank.title}</strong>
                  </span>
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl font-display">
                Welcome back, {user?.name || "Player"}
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Play live games now, challenge online rivals, and track your performance
                as new titles join the arena.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/game"
                className="btn-primary px-6 py-3 text-sm font-semibold shadow-accent-glow hover:shadow-accent-glow-lg cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Now</span>
              </Link>
              <Link
                to="/profile"
                className="btn-secondary px-5 py-3 text-sm font-medium cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Player Performance Statistics */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white font-display">
                Your Performance
              </h2>
              <p className="text-xs text-zinc-400">Real-time match and win metrics</p>
            </div>
            <Link
              to="/profile"
              className="group inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              <span>Full stats & history</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          {isLoading ? (
            <StatsGridSkeleton count={5} />
          ) : statsError ? (
            <ErrorMessage
              title="Unable to load performance statistics"
              message={statsError}
              onRetry={fetchDashboardStats}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {/* Matches */}
              <div className="surface-card p-4 transition-all duration-150 hover:border-zinc-700 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Matches
                </p>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                  {totalGames}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">Games played</p>
              </div>

              {/* Victories */}
              <div className="surface-card border-emerald-500/30 bg-emerald-950/10 p-4 transition-all duration-150 hover:border-emerald-500/50 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Victories
                </p>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-accent font-mono tabular-nums">
                  {wins}
                </p>
                <p className="mt-1 text-[11px] text-emerald-400/80">Wins</p>
              </div>

              {/* Defeats */}
              <div className="surface-card border-rose-500/30 bg-rose-950/10 p-4 transition-all duration-150 hover:border-rose-500/50 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Defeats
                </p>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tabular-nums">
                  {losses}
                </p>
                <p className="mt-1 text-[11px] text-rose-400/80">Losses</p>
              </div>

              {/* Draws */}
              <div className="surface-card p-4 transition-all duration-150 hover:border-zinc-700 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Draws
                </p>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-zinc-200 font-mono tabular-nums">
                  {draws}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">Stalemates</p>
              </div>

              {/* Win Rate */}
              <div className="col-span-2 surface-card p-4 transition-all duration-150 hover:border-zinc-700 sm:col-span-3 sm:p-5 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Win Rate
                  </p>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {wins}/{totalGames}
                  </span>
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                  {`${winRate.toFixed(1)}%`}
                </p>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                    style={{ width: `${Math.min(winRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. Featured Playable Game */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white font-display">
              Playable Now
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Jump into the featured live game — more titles are listed below as Coming Soon.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-[#121217] to-[#101015] p-6 sm:p-8 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]">
            <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                    Featured Game
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Available
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl font-display">
                    Tic-Tac-Toe Arena
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Challenge friends with private room codes or send an invite from the
                    online players list. Every match syncs in real time with rematch and
                    history tracking.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {FEATURE_PILLS.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-lg border border-zinc-800 bg-[#16161c] px-2.5 py-1 text-xs text-zinc-300"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/game")}
                    className="btn-primary px-7 py-3.5 text-sm font-semibold shadow-accent-glow hover:shadow-accent-glow-lg cursor-pointer"
                  >
                    <span>Play Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mini Board Visualization */}
              <div className="flex justify-center md:justify-end">
                <div className="relative rounded-2xl border border-zinc-800/90 bg-[#0d0d10] p-4 shadow-inner">
                  <div className="grid h-48 w-48 grid-cols-3 gap-2">
                    <div className="flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-2xl font-black text-cyan-400 shadow-sm">
                      O
                    </div>
                    <div className="flex items-center justify-center rounded-xl border border-purple-500/30 bg-purple-950/20 text-2xl font-black text-purple-400 shadow-sm">
                      X
                    </div>
                    <div className="rounded-xl border border-zinc-800/50 bg-[#111115]/50" />
                    <div className="rounded-xl border border-zinc-800/50 bg-[#111115]/50" />
                    <div className="flex items-center justify-center rounded-xl border border-accent bg-emerald-950/30 text-2xl font-black text-cyan-400 shadow-[0_0_12px_rgba(34,197,94,0.3)]">
                      O
                    </div>
                    <div className="flex items-center justify-center rounded-xl border border-purple-500/30 bg-purple-950/20 text-2xl font-black text-purple-400 shadow-sm">
                      X
                    </div>
                    <div className="flex items-center justify-center rounded-xl border border-purple-500/30 bg-purple-950/20 text-2xl font-black text-purple-400 shadow-sm">
                      X
                    </div>
                    <div className="rounded-xl border border-zinc-800/50 bg-[#111115]/50" />
                    <div className="flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-2xl font-black text-cyan-400 shadow-sm">
                      O
                    </div>
                  </div>
                  <p className="mt-3 text-center font-mono text-[11px] text-zinc-500 tracking-wider">
                    LIVE ARENA • 1v1 MATCH
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Online Players / Challenge System */}
        <OnlinePlayers
          onlineUsers={onlineUsers}
          currentUserId={user?.id}
          isLoading={isOnlineLoading}
        />

        {/* 5. Upcoming Games */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Roadmap</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white font-display">
                Coming Soon
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Games you can look forward to — not playable yet.
              </p>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-300">
              In Development
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {UPCOMING_GAMES.map((game) => (
              <article
                key={game.id}
                className="surface-card flex flex-col justify-between overflow-hidden p-5 transition-all duration-150 hover:border-zinc-700 hover:bg-[#141419]"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-[#16161c] font-display text-xs font-bold text-zinc-200">
                      {game.iconLabel}
                    </div>
                    <span className="rounded-full border border-amber-500/30 bg-amber-950/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                      Coming Soon
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-display">
                      {game.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                      {game.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-xs text-zinc-500">
                  <span>{game.players}</span>
                  <span className="font-medium text-zinc-400">{game.category}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 6. Compact Leaderboard Preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white font-display">
                Arena Standings
              </h2>
              <p className="text-xs text-zinc-400">Top ranked players across all matches</p>
            </div>
          </div>
          <LeaderboardPreview />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-[#08080a] py-6 text-center text-xs text-zinc-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/10 border border-emerald-500/30 text-accent">
              <Gamepad2 className="w-3 h-3" />
            </div>
            <span className="font-display font-bold tracking-wider text-white">
              PLAY<span className="text-accent">HUB</span>
            </span>
            <span>• Multiplayer Arena</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link to="/game" className="text-zinc-400 hover:text-white transition-colors">
              Play Game
            </Link>
            <Link to="/leaderboard" className="text-zinc-400 hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link to="/profile" className="text-zinc-400 hover:text-white transition-colors">
              Profile
            </Link>
          </div>

          <p>© {new Date().getFullYear()} PlayHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
