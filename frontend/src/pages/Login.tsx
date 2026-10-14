import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAppDispatch } from "../redux/hook";
import { setUser } from "../redux/slices/authSlice";
import Navbar from "../components/Navbar";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getErrorMessage } from "../utils/apiError";
import {
  normalizeEmail,
  validateEmail,
  validateLoginPassword,
} from "../utils/validation";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const emailErr = validateEmail(email);
    const passErr = validateLoginPassword(password);

    setErrors({
      email: emailErr,
      password: passErr,
    });

    return !emailErr && !passErr;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/users/login", {
        email: normalizeEmail(email),
        password,
      });

      dispatch(setUser(response.data));
      navigate("/dashboard");
    } catch (err: unknown) {
      console.error("Login failed:", err);
      setError(getErrorMessage(err, "Invalid email or password."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Navbar variant="public" />

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative grid w-full max-w-5xl overflow-hidden rounded-xl border border-[#27272a] bg-[#111113] lg:grid-cols-2">
          {/* Brand panel */}
          <aside className="relative hidden overflow-hidden border-r border-[#27272a] bg-[#0a0a0b] p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="font-display text-sm font-bold tracking-[0.3em] text-emerald-400">
                PLAYHUB
              </p>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                Welcome back to the arena
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Sign in to challenge online players, join private rooms, and keep
                climbing the leaderboard.
              </p>
            </div>

            <div className="mt-10 grid w-44 grid-cols-3 gap-2 self-center">
              {["X", "O", "", "O", "X", "", "", "O", "X"].map((cell, i) => (
                <div
                  key={i}
                  className={`flex aspect-square items-center justify-center rounded-lg border border-[#27272a] bg-[#111113] text-lg font-black ${
                    cell === "X" ? "text-[#7c6ee6]" : cell === "O" ? "text-[#5ab0e6]" : ""
                  }`}
                >
                  {cell}
                </div>
              ))}
            </div>

            <p className="text-xs text-zinc-500">
              Real-time multiplayer • Private rooms • Competitive ranks
            </p>
          </aside>

          {/* Form */}
          <section className="animate-fade-in flex flex-col justify-center p-6 sm:p-10">
            <div className="mb-8 space-y-2 lg:hidden">
              <p className="font-display text-sm font-bold tracking-[0.3em] text-emerald-400">
                PLAYHUB
              </p>
              <h1 className="text-2xl font-extrabold text-white">Welcome back</h1>
            </div>

            <div className="mb-6 hidden lg:block">
              <h2 className="text-2xl font-extrabold text-white">Login</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Enter your credentials to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {error && <ErrorMessage compact message={error} onDismiss={() => setError(null)} />}

              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium text-zinc-300">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  spellCheck={false}
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    if (errors.email && validateEmail(val) === null) {
                      setErrors((prev) => ({ ...prev, email: null }));
                    }
                  }}
                  onBlur={() => {
                    setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "login-email-error" : undefined}
                  placeholder="you@example.com"
                  className="input-field"
                  disabled={isSubmitting}
                  required
                />
                {errors.email && (
                  <p id="login-email-error" role="alert" className="text-xs text-rose-400 mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-zinc-300">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  maxLength={72}
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);
                    if (errors.password && validateLoginPassword(val) === null) {
                      setErrors((prev) => ({ ...prev, password: null }));
                    }
                  }}
                  onBlur={() => {
                    setErrors((prev) => ({ ...prev, password: validateLoginPassword(password) }));
                  }}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  placeholder="Enter your password"
                  className="input-field"
                  disabled={isSubmitting}
                  required
                />
                {errors.password && (
                  <p id="login-password-error" role="alert" className="text-xs text-rose-400 mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" className="text-white" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm text-zinc-400">
              <p>
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                  Sign up
                </Link>
              </p>
              <Link to="/" className="inline-flex font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
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
