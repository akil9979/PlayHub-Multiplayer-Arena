import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Gamepad2,
  Grid3X3,
  Layers,
  Radio,
  Ship,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Navbar from "../components/Navbar";

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

const FEATURED_GAMES = [
  {
    id: "ttt",
    title: "Tic-Tac-Toe",
    status: "Live",
    statusClass: "border-emerald-500/40 bg-emerald-950/40 text-emerald-400",
    description: "Real-time 1v1 matches with private rooms, challenges, and instant rematch.",
    players: "2 Players • Turn-Based",
    isLive: true,
    icon: Grid3X3,
  },
  {
    id: "connect-4",
    title: "Connect Four",
    status: "Coming Soon",
    statusClass: "border-zinc-800 bg-zinc-900/60 text-zinc-400",
    description: "Drop tokens and align four before your rival claims the vertical grid.",
    players: "1v1 Online",
    isLive: false,
    icon: Layers,
  },
  {
    id: "chess",
    title: "Chess",
    status: "Coming Soon",
    statusClass: "border-zinc-800 bg-zinc-900/60 text-zinc-400",
    description: "Timed multiplayer chess with ranked ladders and tactical rating.",
    players: "1v1 Online",
    isLive: false,
    icon: Crown,
  },
  {
    id: "battleship",
    title: "Battleship",
    status: "Coming Soon",
    statusClass: "border-zinc-800 bg-zinc-900/60 text-zinc-400",
    description: "Place your fleet in secret and hunt enemy coordinates turn by turn.",
    players: "1v1 Online",
    isLive: false,
    icon: Ship,
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up in seconds and join the PlayHub multiplayer arena.",
    icon: Users,
  },
  {
    step: "02",
    title: "Challenge players",
    description: "Invite friends with room codes or challenge anyone live in lobby.",
    icon: Zap,
  },
  {
    step: "03",
    title: "Climb the ranks",
    description: "Win matches, track your record, and rise on the global leaderboard.",
    icon: Trophy,
  },
];

export default function Landing() {
  const navigate = useNavigate();

  const goToSection = (
    event: MouseEvent<HTMLAnchorElement>,
    hash: string
  ) => {
    event.preventDefault();
    navigate({ pathname: "/", hash: hash.replace(/^#/, "") });
    window.requestAnimationFrame(() => scrollToHash(hash));
  };

  return (
    <div className="page-shell flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section id="home" className="relative scroll-mt-24 overflow-hidden border-b border-zinc-800/80">
          {/* Ambient background glow elements */}
          <div
            className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
            <div className="animate-fade-in space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-sm shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>REAL-TIME MULTIPLAYER ARENA</span>
              </div>

              <h1 className="max-w-xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl font-display leading-[1.08]">
                Real-time multiplayer games, built for{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                  competitive play
                </span>
              </h1>

              <p className="max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg">
                Challenge friends, join private rooms, and climb the ladder in live
                turn-based matches — starting with Tic-Tac-Toe Arena.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to="/signup"
                  className="btn-primary px-7 py-3 text-sm font-semibold shadow-accent-glow hover:shadow-accent-glow-lg cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/#featured-games"
                  onClick={(event) => goToSection(event, "#featured-games")}
                  className="btn-secondary px-6 py-3 text-sm font-medium cursor-pointer"
                >
                  Explore Games
                </Link>
                <Link
                  to="/leaderboard"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white px-2 py-2"
                >
                  <span>View Leaderboard</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="pt-4 flex items-center gap-6 text-xs text-zinc-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Instant Socket.IO sync</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Zero lag match rooms</span>
                </div>
              </div>
            </div>

            {/* Visual preview */}
            <div className="animate-fade-in relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
              <div className="relative rounded-2xl border border-zinc-800/90 bg-[#121217]/90 p-6 backdrop-blur-md shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]">
                {/* Header of preview card */}
                <div className="mb-5 flex items-center justify-between border-b border-zinc-800/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-accent">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Live Arena Preview
                      </p>
                      <p className="font-display text-base font-bold text-white">Tic-Tac-Toe Arena</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span>Match Active</span>
                  </span>
                </div>

                {/* Tic-Tac-Toe Grid Preview */}
                <div className="mx-auto grid w-60 grid-cols-3 gap-2.5 sm:w-64">
                  {[
                    { v: "O", c: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20" },
                    { v: "X", c: "text-purple-400 border-purple-500/30 bg-purple-950/20" },
                    { v: "", c: "border-zinc-800/80 bg-[#0d0d10]" },
                    { v: "", c: "border-zinc-800/80 bg-[#0d0d10]" },
                    { v: "O", c: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]" },
                    { v: "X", c: "text-purple-400 border-purple-500/30 bg-purple-950/20" },
                    { v: "X", c: "text-purple-400 border-purple-500/30 bg-purple-950/20" },
                    { v: "", c: "border-zinc-800/80 bg-[#0d0d10]" },
                    { v: "O", c: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20" },
                  ].map((cell, i) => (
                    <div
                      key={i}
                      className={`flex aspect-square items-center justify-center rounded-xl border text-2xl font-black transition-all ${cell.c}`}
                    >
                      {cell.v}
                    </div>
                  ))}
                </div>

                {/* Badges row */}
                <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-zinc-400">
                  <div className="rounded-lg border border-zinc-800/80 bg-[#0e0e12] px-2 py-2">
                    Socket.IO sync
                  </div>
                  <div className="rounded-lg border border-zinc-800/80 bg-[#0e0e12] px-2 py-2">
                    Private rooms
                  </div>
                  <div className="rounded-lg border border-zinc-800/80 bg-[#0e0e12] px-2 py-2">
                    Instant rematch
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Games */}
        <section id="featured-games" className="scroll-mt-24 border-b border-zinc-800/80 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Arena Catalog</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl font-display">
                Featured Games
              </h2>
              <p className="mt-3 text-zinc-400 leading-relaxed">
                Play live titles now and preview upcoming competitive games in development.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_GAMES.map((game) => {
                const IconComponent = game.icon;
                return (
                  <article
                    key={game.id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                      game.isLive
                        ? "border-emerald-500/40 bg-[#121217] shadow-[0_8px_30px_-6px_rgba(34,197,94,0.15)] hover:border-emerald-500/60"
                        : "border-zinc-800/80 bg-[#111115]/90 hover:border-zinc-700 hover:bg-[#141419]"
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-[#18181f] text-zinc-300">
                          <IconComponent className={`w-5 h-5 ${game.isLive ? "text-accent" : "text-zinc-400"}`} />
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${game.statusClass}`}
                        >
                          {game.status}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white font-display">{game.title}</h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{game.description}</p>
                      </div>
                    </div>
                    <div className="mt-6 border-t border-zinc-800/80 pt-3 flex items-center justify-between text-xs text-zinc-500">
                      <span>{game.players}</span>
                      {game.isLive && (
                        <Link
                          to="/game"
                          className="font-semibold text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-1 text-[11px]"
                        >
                          <span>Play</span>
                          <span>→</span>
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Multiplayer feature highlight */}
        <section className="border-b border-zinc-800/80 py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                <Radio className="w-3.5 h-3.5" />
                <span>Architecture</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl font-display">
                Built for real-time multiplayer
              </h2>
              <p className="mt-4 text-zinc-400 leading-relaxed text-base">
                PlayHub keeps both players synchronized with low-latency Socket.IO rooms,
                live presence tracking, and instant challenges — making every turn feel immediate.
              </p>
              <ul className="mt-6 space-y-3.5 text-sm text-zinc-300">
                <li className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-accent border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <span>Private room codes for fast friend matching</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-accent border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <span>Online player directory with one-click live invites</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-accent border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <span>Graceful rematch negotiation after every finished match</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-[#121217] p-6 sm:p-8 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Live Event Stream
                </p>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { text: "Alex challenged you to Tic-Tac-Toe", time: "just now", highlight: true },
                  { text: "Room AB12CD ready — Circle vs Cross", time: "1m ago", highlight: false },
                  { text: "Rematch accepted by rival", time: "3m ago", highlight: false },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs sm:text-sm ${
                      item.highlight
                        ? "border-emerald-500/40 bg-emerald-950/20 text-zinc-100"
                        : "border-zinc-800/80 bg-[#0d0d10] text-zinc-300"
                    }`}
                  >
                    <span>{item.text}</span>
                    <span className="text-[10px] text-zinc-500 shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Competitive / Leaderboard */}
        <section className="border-b border-zinc-800/80 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121217] p-8 sm:p-12 shadow-[0_16px_50px_-10px_rgba(0,0,0,0.7)]">
              {/* Radial glow in card */}
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"
                aria-hidden
              />

              <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Ranked Tier</span>
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl font-display">
                    Compete on the global leaderboard
                  </h2>
                  <p className="mt-4 text-zinc-400 leading-relaxed text-sm sm:text-base">
                    Every win, loss, and draw counts towards your rank. Track your win rate,
                    climb the podium, and see how you stack up against top players.
                  </p>
                  <Link
                    to="/leaderboard"
                    className="btn-primary mt-6 inline-flex items-center gap-2 cursor-pointer shadow-accent-glow"
                  >
                    <span>View Leaderboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3.5 text-center">
                  {[
                    { label: "Wins Tracked", value: "Realtime", hint: "Verified games" },
                    { label: "Win Rate", value: "Tracked %", hint: "Performance index" },
                    { label: "Leaderboard", value: "Top Ranks", hint: "Global podium" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-zinc-800/80 bg-[#0c0c0f] px-3.5 py-5 transition-transform hover:-translate-y-0.5"
                    >
                      <p className="font-display text-lg sm:text-xl font-bold text-white">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-accent">{stat.label}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-500">{stat.hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="scroll-mt-24 border-b border-zinc-800/80 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span>Simple Flow</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl font-display">
                How PlayHub Works
              </h2>
              <p className="mt-3 text-zinc-400">
                Three simple steps from account setup to your first competitive match.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {STEPS.map((item) => {
                const StepIcon = item.icon;
                return (
                  <article
                    key={item.step}
                    className="relative rounded-2xl border border-zinc-800/80 bg-[#121217] p-6 shadow-sm transition-all hover:border-zinc-700 hover:bg-[#141419]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-bold text-accent tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/50">
                        Step {item.step}
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-zinc-300">
                        <StepIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-white font-display">{item.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div className="h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-[#131318] to-[#0c0c0f] px-6 py-14 text-center sm:px-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
              <div className="relative space-y-5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-accent">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>START PLAYING TODAY</span>
                </div>

                <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                  Ready to test your skills?
                </h2>
                <p className="mx-auto max-w-xl text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Create your free PlayHub account and jump directly into a live Tic-Tac-Toe match.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
                  <Link
                    to="/signup"
                    className="btn-primary px-8 py-3 text-sm font-semibold shadow-accent-glow cursor-pointer"
                  >
                    Play Now Free
                  </Link>
                  <Link to="/login" className="btn-secondary px-8 py-3 text-sm font-medium cursor-pointer">
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#08080a] py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="max-w-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-accent">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <p className="font-display text-lg font-bold tracking-wider text-white">
                PLAY<span className="text-accent">HUB</span>
              </p>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              A real-time multiplayer gaming platform engineered for competitive turn-based play.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-xs sm:grid-cols-3">
            <div className="space-y-2.5">
              <p className="font-semibold uppercase tracking-wider text-zinc-200">Product</p>
              <Link
                to="/#featured-games"
                onClick={(event) => goToSection(event, "#featured-games")}
                className="block text-zinc-400 hover:text-white transition-colors"
              >
                Games
              </Link>
              <Link to="/leaderboard" className="block text-zinc-400 hover:text-white transition-colors">
                Leaderboard
              </Link>
            </div>
            <div className="space-y-2.5">
              <p className="font-semibold uppercase tracking-wider text-zinc-200">Account</p>
              <Link to="/login" className="block text-zinc-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/signup" className="block text-zinc-400 hover:text-white transition-colors">
                Sign Up
              </Link>
            </div>
            <div className="space-y-2.5">
              <p className="font-semibold uppercase tracking-wider text-zinc-200">Play</p>
              <Link
                to="/#how-it-works"
                onClick={(event) => goToSection(event, "#how-it-works")}
                className="block text-zinc-400 hover:text-white transition-colors"
              >
                How It Works
              </Link>
              <Link to="/signup" className="block text-zinc-400 hover:text-white transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-zinc-800/60 pt-6 px-4 text-center text-xs text-zinc-500 sm:px-6 lg:px-8 lg:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PlayHub. All rights reserved.</p>
          <p className="text-zinc-600">Built for competitive multiplayer.</p>
        </div>
      </footer>
    </div>
  );
}
