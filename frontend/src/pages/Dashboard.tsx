import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../redux/hook";
import api from "../api/axios";
import { socket } from "../Socket";
import Navbar from "../components/Navbar";
import OnlinePlayers from "../components/OnlinePlayers";
import LeaderboardPreview from "../components/LeaderboardPreview";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        const statsRes = await api.get("/users/stats");
        if (isMounted) {
          setStats(statsRes.data || null);
        }
      } catch (error) {
        console.error("Failed to load user stats:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardStats();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOnlineUsers = (users: OnlineUser[]) => {
      setOnlineUsers(users);
    };

    socket.on("online-users", handleOnlineUsers);

    if (socket.connected) {
      socket.emit("get-online-users");
    }

    return () => {
      socket.off("online-users", handleOnlineUsers);
    };
  }, []);

  const totalGames = stats ? stats.games_played : 0;
  const wins = stats ? stats.wins : 0;
  const losses = stats ? stats.losses : 0;
  const draws = stats ? stats.draws : 0;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

  const getRankBadge = () => {
    if (totalGames === 0) return { title: "Unranked", color: "text-slate-400" };
    if (winRate >= 70 && totalGames >= 5)
      return { title: "Grandmaster", color: "text-amber-400" };
    if (winRate >= 50 && totalGames >= 3)
      return { title: "Veteran Tactician", color: "text-indigo-400" };
    return { title: "Challenger", color: "text-emerald-400" };
  };

  const rank = getRankBadge();

  return (
    <div className="page-shell flex flex-col">
      <Navbar variant="authenticated" />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        {/* 1. Welcome / Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                  </span>
                  Arena Online
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300">
                  Rank: <strong className={rank.color}>{rank.title}</strong>
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {user?.name || "Player"}
                </span>
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
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
            <h2 className="text-xl font-bold tracking-tight text-white">
              Your Performance
            </h2>
            <Link
              to="/profile"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Full stats & history →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            <div className="surface-card p-4 transition hover:border-slate-700 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Matches
              </p>
              <p className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                {isLoading ? "..." : totalGames}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Games played</p>
            </div>

            <div className="surface-card border-emerald-500/20 p-4 transition hover:border-emerald-500/40 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Victories
              </p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-400 sm:text-3xl">
                {isLoading ? "..." : wins}
              </p>
              <p className="mt-1 text-[11px] text-emerald-500/80">Wins</p>
            </div>

            <div className="surface-card border-rose-500/20 p-4 transition hover:border-rose-500/40 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Defeats
              </p>
              <p className="mt-2 text-2xl font-extrabold text-rose-400 sm:text-3xl">
                {isLoading ? "..." : losses}
              </p>
              <p className="mt-1 text-[11px] text-rose-500/80">Losses</p>
            </div>

            <div className="surface-card border-amber-500/20 p-4 transition hover:border-amber-500/40 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Draws
              </p>
              <p className="mt-2 text-2xl font-extrabold text-amber-400 sm:text-3xl">
                {isLoading ? "..." : draws}
              </p>
              <p className="mt-1 text-[11px] text-amber-500/80">Stalemates</p>
            </div>

            <div className="col-span-2 surface-card border-indigo-500/20 p-4 transition hover:border-indigo-500/40 sm:col-span-3 sm:p-5 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Win Rate
              </p>
              <p className="mt-2 text-2xl font-extrabold text-indigo-300 sm:text-3xl">
                {isLoading ? "..." : `${winRate.toFixed(1)}%`}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(winRate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Featured playable game */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Playable Now
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Jump into the featured live game — more titles are listed below as Coming Soon.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/90 to-purple-950/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-gradient-to-r from-indigo-600 to-pink-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    Featured Game
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    Available
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Tic-Tac-Toe Arena
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    Challenge friends with private room codes or send an invite from the
                    online players list. Every match syncs in real time with rematch and
                    history tracking.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {FEATURE_PILLS.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-lg border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300"
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
                <div className="relative rounded-2xl border border-indigo-500/30 bg-slate-950/80 p-4 shadow-2xl">
                  <div className="grid h-48 w-48 grid-cols-3 gap-2">
                    <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-2xl font-black text-cyan-400 shadow-inner">
                      O
                    </div>
                    <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-2xl font-black text-purple-400 shadow-inner">
                      X
                    </div>
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/50" />
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/50" />
                    <div className="flex items-center justify-center rounded-xl border border-indigo-500/40 bg-slate-900 text-2xl font-black text-cyan-400 shadow-lg shadow-cyan-500/20 animate-pulse">
                      O
                    </div>
                    <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-2xl font-black text-purple-400 shadow-inner">
                      X
                    </div>
                    <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-2xl font-black text-purple-400 shadow-inner">
                      X
                    </div>
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/50" />
                    <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-2xl font-black text-cyan-400 shadow-inner">
                      O
                    </div>
                  </div>
                  <p className="mt-3 text-center font-mono text-[11px] text-indigo-300">
                    LIVE ARENA • 1v1 MATCH
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Online players / challenge system */}
        <OnlinePlayers onlineUsers={onlineUsers} currentUserId={user?.id} />

        {/* 5. Upcoming games */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Coming Soon
              </h2>
              <p className="mt-1 text-sm text-slate-400">
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
                className="surface-card group relative flex flex-col justify-between overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-700"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 font-display text-xs font-bold text-indigo-300 shadow-inner transition-transform group-hover:scale-110">
                      {game.iconLabel}
                    </div>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                      Coming Soon
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white transition-colors group-hover:text-indigo-300">
                      {game.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {game.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs text-slate-500">
                  <span>{game.players}</span>
                  <span className="font-medium">{game.category}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 6. Platform info — compact leaderboard preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Arena Standings
            </h2>
            <Link
              to="/leaderboard"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Full leaderboard →
            </Link>
          </div>
          <LeaderboardPreview />
        </section>
      </main>

      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold tracking-wider text-slate-400">
              PLAYHUB
            </span>
            <span>• Multiplayer Arena</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/dashboard" className="hover:text-slate-300">
              Dashboard
            </Link>
            <Link to="/game" className="hover:text-slate-300">
              Play Game
            </Link>
            <Link to="/leaderboard" className="hover:text-slate-300">
              Leaderboard
            </Link>
            <Link to="/profile" className="hover:text-slate-300">
              Profile
            </Link>
          </div>

          <p>© {new Date().getFullYear()} PlayHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
