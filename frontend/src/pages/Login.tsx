import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAppDispatch } from "../redux/hook";
import { setUser } from "../redux/slices/authSlice";
import Navbar from "../components/Navbar";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/users/login", {
        email,
        password,
      });

      dispatch(setUser(response.data));
      navigate("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
          ? err.response.data.message
          : "Invalid email or password.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Navbar variant="public" />

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.15),_transparent_55%)]" />

        <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
          {/* Brand panel */}
          <aside className="relative hidden overflow-hidden border-r border-slate-800 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
            <div>
              <p className="font-display text-sm font-bold tracking-[0.3em] text-indigo-400">
                PLAYHUB
              </p>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                Welcome back to the arena
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Sign in to challenge online players, join private rooms, and keep
                climbing the leaderboard.
              </p>
            </div>

            <div className="mt-10 grid w-44 grid-cols-3 gap-2 self-center">
              {["X", "O", "", "O", "X", "", "", "O", "X"].map((cell, i) => (
                <div
                  key={i}
                  className={`flex aspect-square items-center justify-center rounded-lg border border-slate-800 bg-slate-950/80 text-lg font-black ${
                    cell === "X" ? "text-purple-400" : cell === "O" ? "text-cyan-400" : ""
                  }`}
                >
                  {cell}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              Real-time multiplayer • Private rooms • Competitive ranks
            </p>
          </aside>

          {/* Form */}
          <section className="animate-fade-in flex flex-col justify-center p-6 sm:p-10">
            <div className="mb-8 space-y-2 lg:hidden">
              <p className="font-display text-sm font-bold tracking-[0.3em] text-indigo-400">
                PLAYHUB
              </p>
              <h1 className="text-2xl font-extrabold text-white">Welcome back</h1>
            </div>

            <div className="mb-6 hidden lg:block">
              <h2 className="text-2xl font-extrabold text-white">Login</h2>
              <p className="mt-1 text-sm text-slate-400">
                Enter your credentials to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full py-3.5" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Login"}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm text-slate-400">
              <p>
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="font-semibold text-indigo-300 hover:text-indigo-200">
                  Sign up
                </Link>
              </p>
              <Link to="/" className="inline-flex font-medium text-slate-500 hover:text-slate-300">
                ← Back to Landing
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Login;
