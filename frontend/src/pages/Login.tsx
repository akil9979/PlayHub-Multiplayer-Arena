import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Gamepad2, Lock, Mail } from "lucide-react";
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
  const [errors, setErrors] = useState<{
    email?: string | null;
    password?: string | null;
  }>({});
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

  const handleLogin = async (e: FormEvent) => {
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
        <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#111115] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] lg:grid-cols-2">
          {/* Brand panel */}
          <aside className="relative hidden overflow-hidden border-r border-zinc-800/80 bg-gradient-to-br from-[#0c0c0e] via-[#0f0f13] to-[#0a0a0c] p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-accent">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <p className="font-display text-xs font-bold tracking-[0.25em] text-accent uppercase">
                  PLAYHUB ARENA
                </p>
              </div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white font-display">
                Welcome back to the arena
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Sign in to challenge online players, join private rooms, and
                keep climbing the global leaderboard.
              </p>
            </div>

            {/* Aesthetic Mini Board Preview */}
            <div className="relative z-10 my-8 flex justify-center">
              <div className="grid w-48 grid-cols-3 gap-2.5 rounded-2xl border border-zinc-800/90 bg-[#0d0d10]/80 p-3 shadow-inner">
                {["X", "O", "", "O", "X", "", "", "O", "X"].map((cell, i) => (
                  <div
                    key={i}
                    className={`flex aspect-square items-center justify-center rounded-xl border border-zinc-800 bg-[#141419] text-base font-black shadow-sm transition-transform ${
                      cell === "X"
                        ? "text-purple-400 border-purple-500/30 bg-purple-950/20"
                        : cell === "O"
                          ? "text-cyan-400 border-cyan-500/30 bg-cyan-950/20"
                          : "border-zinc-800/60"
                    }`}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span>
                Real-time multiplayer • Private rooms • Competitive ranks
              </span>
            </div>

            {/* Ambient background glow */}
            <div
              className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
              aria-hidden
            />
          </aside>

          {/* Form */}
          <section className="animate-fade-in flex flex-col justify-center p-6 sm:p-10 lg:p-12">
            <div className="mb-8 space-y-2 lg:hidden">
              <p className="font-display text-xs font-bold tracking-[0.25em] text-accent uppercase">
                PLAYHUB
              </p>
              <h1 className="text-2xl font-extrabold text-white font-display">
                Welcome back
              </h1>
            </div>

            <div className="mb-6 hidden lg:block">
              <h2 className="text-2xl font-extrabold text-white font-display">
                Login
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Enter your credentials to continue to your dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {error && (
                <ErrorMessage
                  compact
                  message={error}
                  onDismiss={() => setError(null)}
                />
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
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
                      setErrors((prev) => ({
                        ...prev,
                        email: validateEmail(email),
                      }));
                    }}
                    aria-invalid={!!errors.email}
                    aria-describedby={
                      errors.email ? "login-email-error" : undefined
                    }
                    placeholder="you@example.com"
                    className="input-field input-field-with-icon"
                    style={{ paddingLeft: "2.75rem" }}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {errors.email && (
                  <p
                    id="login-email-error"
                    role="alert"
                    className="text-xs text-rose-400 mt-1"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    maxLength={72}
                    value={password}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPassword(val);
                      if (
                        errors.password &&
                        validateLoginPassword(val) === null
                      ) {
                        setErrors((prev) => ({ ...prev, password: null }));
                      }
                    }}
                    onBlur={() => {
                      setErrors((prev) => ({
                        ...prev,
                        password: validateLoginPassword(password),
                      }));
                    }}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "login-password-error" : undefined
                    }
                    placeholder="Enter your password"
                    className="input-field input-field-with-icon"
                    style={{ paddingLeft: "2.75rem" }}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {errors.password && (
                  <p
                    id="login-password-error"
                    role="alert"
                    className="text-xs text-rose-400 mt-1"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 mt-2 cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" className="text-zinc-950" />
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
                <Link
                  to="/signup"
                  className="font-semibold text-accent hover:text-accent-hover transition-colors"
                >
                  Sign up
                </Link>
              </p>
              <div>
                <Link
                  to="/"
                  className="group inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>Back to Landing</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Login;
