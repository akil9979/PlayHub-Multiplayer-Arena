import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../redux/hook";
import api from "../api/axios";
import { socket } from "../Socket";
import Navbar from "../components/Navbar";
import OnlinePlayers from "../components/OnlinePlayers";
import type { GameStats, OnlineUser } from "../types/game";

interface ComingSoonGame {
  id: string;
  title: string;
  category: string;
  players: string;
  badge: "Coming Soon" | "In Development" | "Planned";
  badgeColor: string;
  icon: string;
  description: string;
}

const UPCOMING_GAMES: ComingSoonGame[] = [
  {
    id: "connect-4",
    title: "Connect Four",
    category: "Strategy",
    players: "1v1 Online",
    badge: "In Development",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    icon: "🔴",
    description: "Drop tokens into the grid and align 4 in a row before your rival does.",
  },
  {
    id: "chess-royale",
    title: "Chess Royale",
    category: "Grandmaster",
    players: "1v1 Online",
    badge: "Coming Soon",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: "♟️",
    description: "Multiplayer timed blitz chess matches with custom clock intervals.",
  },
  {
    id: "battleship",
    title: "Battleship Arena",
    category: "Tactical Grid",
    players: "1v1 Online",
    badge: "Coming Soon",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    icon: "🚢",
    description: "Secretly position your naval fleet and target enemy coordinates.",
  },
  {
    id: "rps-duel",
    title: "Rock Paper Scissors",
    category: "Speed Battle",
    players: "1v1 Instant",
    badge: "Planned",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    icon: "✂️",
    description: "Rapid-fire best-of-5 psychological hand duel with instant animations.",
  },
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

  // Rating badge based on win rate & games played
  const getRankBadge = () => {
    if (totalGames === 0) return { title: "Unranked", color: "text-slate-400", tier: "Bronze" };
    if (winRate >= 70 && totalGames >= 5) return { title: "Grandmaster", color: "text-amber-400", tier: "Diamond" };
    if (winRate >= 50 && totalGames >= 3) return { title: "Veteran Tactician", color: "text-indigo-400", tier: "Platinum" };
    return { title: "Challenger", color: "text-emerald-400", tier: "Gold" };
  };

  const rank = getRankBadge();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Dashboard Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        {/* Welcome Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Subtle decorative glow balls */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  Season 1 Live
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300">
                  Rank: <strong className={rank.color}>{rank.title}</strong>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {user?.name || "Player"}
                </span>{" "}
                👋
              </h1>

              <p className="max-w-2xl text-sm sm:text-base text-slate-400 leading-relaxed">
                Step onto the board, challenge rivals in real-time, and climb the competitive ladder. Track your combat statistics and battle history.
              </p>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/game"
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-95"
              >
                <span>🎮 Quick Match</span>
                <svg
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>

              <Link
                to="/profile"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/90 px-5 py-3.5 text-sm font-semibold text-slate-200 shadow-md transition-all duration-200 hover:border-slate-600 hover:bg-slate-700 hover:text-white active:scale-95"
              >
                <span>👤 Full Profile & History</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Compact Statistics Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>📊 Combat Performance</span>
            </h2>
            <Link
              to="/profile"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View Match History in Profile →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Stat 1: Games Played */}
            <div className="group rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Matches
                </span>
                <span className="text-base">🎮</span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
                {isLoading ? "..." : totalGames}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Total games played</p>
            </div>

            {/* Stat 2: Wins */}
            <div className="group rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-4 sm:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/90">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Victories
                </span>
                <span className="text-base">🏆</span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {isLoading ? "..." : wins}
              </p>
              <p className="mt-1 text-[11px] text-emerald-500/80">Wins achieved</p>
            </div>

            {/* Stat 3: Losses */}
            <div className="group rounded-2xl border border-rose-500/20 bg-slate-900/60 p-4 sm:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-rose-500/40 hover:bg-slate-900/90">
              <div className="flex items-center justify-between text-rose-400">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Defeats
                </span>
                <span className="text-base">💀</span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-400">
                {isLoading ? "..." : losses}
              </p>
              <p className="mt-1 text-[11px] text-rose-500/80">Matches lost</p>
            </div>

            {/* Stat 4: Draws */}
            <div className="group rounded-2xl border border-amber-500/20 bg-slate-900/60 p-4 sm:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-amber-500/40 hover:bg-slate-900/90">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Draws
                </span>
                <span className="text-base">🤝</span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-400">
                {isLoading ? "..." : draws}
              </p>
              <p className="mt-1 text-[11px] text-amber-500/80">Stalemates</p>
            </div>

            {/* Stat 5: Win Rate */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 group rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-4 sm:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-indigo-500/40 hover:bg-slate-900/90">
              <div className="flex items-center justify-between text-indigo-400">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Win Rate
                </span>
                <span className="text-base">⚡</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-indigo-300">
                  {isLoading ? "..." : `${winRate.toFixed(1)}%`}
                </p>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(winRate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Game Card & Matchmaking Hub */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prominent Play Card (2 cols on large screens) */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/90 to-purple-950/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4 max-w-md">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-gradient-to-r from-indigo-600 to-pink-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    Featured Game
                  </span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    ● Live Multiplayer
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Tic-Tac-Toe Arena
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Challenge a friend with private custom room codes or jump into instant 1v1 turn-based combat. Real-time board sync, instant move verification, and rematch system.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 border border-slate-700/60">
                    ⚔️ 2 Players
                  </span>
                  <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 border border-slate-700/60">
                    ⚡ Socket.io Realtime
                  </span>
                  <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 border border-slate-700/60">
                    🔄 Rematch Support
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => navigate("/game")}
                    className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 px-7 py-4 text-base font-extrabold text-white shadow-xl shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-95"
                  >
                    <span>Play Tic-Tac-Toe Now</span>
                    <span className="text-lg">➔</span>
                  </button>
                </div>
              </div>

              {/* Decorative Mini Game Preview Board */}
              <div className="flex justify-center md:justify-end">
                <div className="relative rounded-2xl border border-indigo-500/30 bg-slate-950/80 p-4 shadow-2xl">
                  <div className="grid grid-cols-3 gap-2 w-48 h-48">
                    <div className="flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-2xl font-black text-cyan-400 shadow-inner">
                      O
                    </div>
                    <div className="flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-2xl font-black text-purple-400 shadow-inner">
                      X
                    </div>
                    <div className="flex items-center justify-center rounded-xl bg-slate-900/50 border border-slate-800/50"></div>
                    <div className="flex items-center justify-center rounded-xl bg-slate-900/50 border border-slate-800/50"></div>
                    <div className="flex items-center justify-center rounded-xl bg-slate-900 border border-indigo-500/40 text-2xl font-black text-cyan-400 shadow-lg shadow-cyan-500/20 animate-pulse">
                      O
                    </div>
                    <div className="flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-2xl font-black text-purple-400 shadow-inner">
                      X
                    </div>
                    <div className="flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-2xl font-black text-purple-400 shadow-inner">
                      X
                    </div>
                    <div className="flex items-center justify-center rounded-xl bg-slate-900/50 border border-slate-800/50"></div>
                    <div className="flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-2xl font-black text-cyan-400 shadow-inner">
                      O
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-[11px] font-mono text-indigo-300">
                      LIVE ARENA • 1v1 MATCH
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Profile & Navigation Card (1 col on large screens) */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-7 shadow-xl backdrop-blur-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-lg font-black text-white shadow-md">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h4 className="font-bold text-white leading-tight">
                      {user?.name}
                    </h4>
                    <p className="text-xs text-slate-400 truncate max-w-[150px]">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-indigo-400">
                  {rank.tier}
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                  <span className="text-slate-400">Account Status</span>
                  <span className="font-medium text-emerald-400">● Active</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                  <span className="text-slate-400">Win / Loss Ratio</span>
                  <span className="font-semibold text-slate-200">
                    {losses === 0 ? wins : (wins / losses).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Member Since</span>
                  <span className="font-medium text-slate-300">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "Recent"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
              <Link
                to="/profile"
                className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                <span>View Career History & Stats</span>
                <span>➔</span>
              </Link>
              <Link
                to="/game"
                className="flex items-center justify-between rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-600/30"
              >
                <span>Enter Game Room</span>
                <span>⚔️</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Online Players Section */}
        <OnlinePlayers
          onlineUsers={onlineUsers}
          currentUserId={user?.id}
        />

        {/* More Games / Coming Soon Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>🚀 Upcoming Games</span>
              </h2>
              <p className="text-xs text-slate-400">
                Explore multiplayer titles currently under development
              </p>
            </div>
            <span className="rounded-full bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-300">
              Arena Arcade
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {UPCOMING_GAMES.map((game) => (
              <div
                key={game.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/90"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      {game.icon}
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${game.badgeColor}`}
                    >
                      {game.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {game.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span>👥</span> {game.players}
                  </span>
                  <span className="font-medium text-slate-500 group-hover:text-slate-400">
                    {game.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modern Gaming Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎮</span>
            <span className="font-bold text-slate-400">PlayHub Multiplayer</span>
            <span>• Turn-based Arena</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/" className="hover:text-slate-300">
              Dashboard
            </Link>
            <Link to="/game" className="hover:text-slate-300">
              Play Game
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
