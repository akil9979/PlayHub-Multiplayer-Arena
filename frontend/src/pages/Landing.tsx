import { Link, useNavigate } from "react-router-dom";
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
    statusClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    description: "Real-time 1v1 matches with private rooms, challenges, and rematch.",
    players: "2 Players",
  },
  {
    id: "connect-4",
    title: "Connect Four",
    status: "Coming Soon",
    statusClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    description: "Drop tokens and align four before your rival claims the grid.",
    players: "1v1 Online",
  },
  {
    id: "chess",
    title: "Chess",
    status: "Coming Soon",
    statusClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    description: "Timed multiplayer chess with ranked ladders on the way.",
    players: "1v1 Online",
  },
  {
    id: "battleship",
    title: "Battleship",
    status: "Coming Soon",
    statusClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    description: "Place your fleet in secret and hunt enemy coordinates.",
    players: "1v1 Online",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up in seconds and join the PlayHub multiplayer arena.",
  },
  {
    step: "02",
    title: "Challenge players",
    description: "Invite friends with room codes or challenge anyone online.",
  },
  {
    step: "03",
    title: "Climb the ranks",
    description: "Win matches, track your record, and rise on the leaderboard.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  const goToSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
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
        {/* Hero */}
        <section id="home" className="relative scroll-mt-24 overflow-hidden border-b border-slate-800/60">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.18),_transparent_55%)]" />
          <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
            <div className="animate-fade-in space-y-6">
              <p className="font-display text-sm font-bold tracking-[0.35em] text-indigo-400">
                PLAYHUB
              </p>
              <h1 className="max-w-xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Real-time multiplayer games, built for competitive play
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
                Challenge friends, join private rooms, and climb the ladder in live
                turn-based matches — starting with Tic-Tac-Toe Arena.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/signup" className="btn-primary px-7 py-3.5 text-sm">
                  Get Started
                </Link>
                <Link
                  to="/#featured-games"
                  onClick={(event) => goToSection(event, "#featured-games")}
                  className="btn-secondary px-7 py-3.5 text-sm"
                >
                  Explore Games
                </Link>
                <Link
                  to="/leaderboard"
                  className="text-sm font-semibold text-indigo-300 transition hover:text-indigo-200"
                >
                  View Leaderboard →
                </Link>
              </div>
            </div>

            {/* Visual preview */}
            <div className="animate-fade-in relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
              <div className="surface-card-lg relative overflow-hidden border-indigo-500/30 p-6 shadow-2xl shadow-indigo-500/10">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                      Live Arena Preview
                    </p>
                    <p className="font-display text-lg font-bold text-white">Tic-Tac-Toe</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>

                <div className="animate-float mx-auto grid w-56 grid-cols-3 gap-2 sm:w-64">
                  {[
                    { v: "O", c: "text-cyan-400" },
                    { v: "X", c: "text-purple-400" },
                    { v: "", c: "" },
                    { v: "", c: "" },
                    { v: "O", c: "text-cyan-400 border-indigo-500/50 shadow-cyan-500/20 shadow-lg animate-pulse" },
                    { v: "X", c: "text-purple-400" },
                    { v: "X", c: "text-purple-400" },
                    { v: "", c: "" },
                    { v: "O", c: "text-cyan-400" },
                  ].map((cell, i) => (
                    <div
                      key={i}
                      className={`flex aspect-square items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-2xl font-black ${cell.c}`}
                    >
                      {cell.v}
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-2">
                    Real-time sync
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-2">
                    Private rooms
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-2">
                    Rematch ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Games */}
        <section id="featured-games" className="scroll-mt-24 border-b border-slate-800/60 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Featured Games
              </h2>
              <p className="mt-3 text-slate-400">
                Play live titles now and preview what is coming next to the arena.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_GAMES.map((game) => (
                <article
                  key={game.id}
                  className="surface-card flex flex-col justify-between p-5 transition hover:-translate-y-1 hover:border-slate-700"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-white">{game.title}</h3>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${game.statusClass}`}
                      >
                        {game.status}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-400">{game.description}</p>
                  </div>
                  <p className="mt-5 border-t border-slate-800 pt-3 text-xs text-slate-500">
                    {game.players}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Multiplayer feature */}
        <section className="border-b border-slate-800/60 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Built for real-time multiplayer
              </h2>
              <p className="mt-4 text-slate-400 leading-relaxed">
                PlayHub keeps both players in sync with Socket.IO powered rooms,
                live presence, and instant challenge invites — so every move feels
                immediate.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                  Private room codes for friends
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                  Online player list with one-click challenges
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                  Rematch flow after every finished match
                </li>
              </ul>
            </div>
            <div className="surface-card-lg border-indigo-500/20 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Live session
              </p>
              <div className="mt-4 space-y-3">
                {["Alex challenged you to Tic-Tac-Toe", "Room AB12CD ready", "Rematch requested"].map(
                  (line) => (
                    <div
                      key={line}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300"
                    >
                      {line}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Competitive / leaderboard */}
        <section className="border-b border-slate-800/60 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="surface-card-lg relative overflow-hidden border-indigo-500/20 p-8 sm:p-10">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />
              <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    Compete on the global leaderboard
                  </h2>
                  <p className="mt-4 text-slate-400 leading-relaxed">
                    Every win, loss, and draw counts. Track your win rate, climb the
                    rankings, and see how you stack up against other players.
                  </p>
                  <Link to="/leaderboard" className="btn-primary mt-6">
                    View Leaderboard
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Wins", value: "Track" },
                    { label: "Win Rate", value: "Climb" },
                    { label: "Rank", value: "Rise" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-5"
                    >
                      <p className="font-display text-xl font-bold text-indigo-300">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-24 border-b border-slate-800/60 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                How PlayHub Works
              </h2>
              <p className="mt-3 text-slate-400">
                Three steps from signup to your first competitive match.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {STEPS.map((item) => (
                <article key={item.step} className="surface-card p-6">
                  <p className="font-display text-sm font-bold text-indigo-400">
                    {item.step}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 px-6 py-12 text-center sm:px-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.2),_transparent_60%)]" />
              <div className="relative space-y-5">
                <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ready to play?
                </h2>
                <p className="mx-auto max-w-xl text-slate-300">
                  Create your free PlayHub account and jump into a live Tic-Tac-Toe match.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link to="/signup" className="btn-primary px-8 py-3.5">
                    Play Now
                  </Link>
                  <Link to="/login" className="btn-secondary px-8 py-3.5">
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="max-w-sm space-y-2">
            <p className="font-display text-lg font-bold tracking-wider text-white">PLAYHUB</p>
            <p className="text-sm text-slate-400">
              A real-time multiplayer gaming platform for competitive turn-based play.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className="font-semibold text-slate-200">Product</p>
              <Link
                to="/#featured-games"
                onClick={(event) => goToSection(event, "#featured-games")}
                className="block text-slate-400 hover:text-white"
              >
                Games
              </Link>
              <Link to="/leaderboard" className="block text-slate-400 hover:text-white">
                Leaderboard
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-200">Account</p>
              <Link to="/login" className="block text-slate-400 hover:text-white">
                Login
              </Link>
              <Link to="/signup" className="block text-slate-400 hover:text-white">
                Sign Up
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-200">Play</p>
              <Link
                to="/#how-it-works"
                onClick={(event) => goToSection(event, "#how-it-works")}
                className="block text-slate-400 hover:text-white"
              >
                How It Works
              </Link>
              <Link to="/signup" className="block text-slate-400 hover:text-white">
                Get Started
              </Link>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-7xl px-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8 lg:text-left">
          © {new Date().getFullYear()} PlayHub. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
