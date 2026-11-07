import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, Gamepad2, Lock, Mail, User } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getErrorMessage } from "../utils/apiError";
import {
  normalizeEmail,
  normalizeName,
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/validation";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string | null;
    email?: string | null;
    password?: string | null;
    confirmPassword?: string | null;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const validateConfirmPassword = (confirm: string, pass: string): string | null => {
    if (!confirm) return "Please confirm your password.";
    if (confirm !== pass) return "Passwords do not match.";
    return null;
  };

  const validateForm = (): boolean => {
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(confirmPassword, password);

    setErrors({
      name: nameErr,
      email: emailErr,
      password: passwordErr,
      confirmPassword: confirmErr,
    });

    return !nameErr && !emailErr && !passwordErr && !confirmErr;
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/users/create", {
        name: normalizeName(name),
        email: normalizeEmail(email),
        password,
      });

      setSuccess("Account created successfully! Redirecting to login...");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setErrors({});

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err: unknown) {
      console.error("Signup failed:", err);
      setError(
        getErrorMessage(err, "Something went wrong while creating your account.")
      );
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
                Create your player profile
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Join the arena, challenge rivals in real time, and start building
                your competitive match record.
              </p>
            </div>

            <ul className="relative z-10 mt-8 space-y-3 text-sm text-zinc-200">
              <li className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-[#141419]/90 px-4 py-3 shadow-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-accent border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span>Live Tic-Tac-Toe multiplayer</span>
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-[#141419]/90 px-4 py-3 shadow-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-accent border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span>Online challenges & private rooms</span>
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-[#141419]/90 px-4 py-3 shadow-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-accent border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span>Match history & leaderboard ranks</span>
              </li>
            </ul>

            <div className="relative z-10 flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span>Free to join • Instant play • No download required</span>
            </div>

            {/* Ambient glow */}
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
              <h1 className="text-2xl font-extrabold text-white font-display">Create account</h1>
            </div>

            <div className="mb-6 hidden lg:block">
              <h2 className="text-2xl font-extrabold text-white font-display">Sign Up</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Set up your PlayHub account to start playing.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4" noValidate>
              {error && <ErrorMessage compact message={error} onDismiss={() => setError(null)} />}
              {success && (
                <div
                  role="status"
                  className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="signup-name" className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    maxLength={30}
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setName(val);
                      if (errors.name && validateName(val) === null) {
                        setErrors((prev) => ({ ...prev, name: null }));
                      }
                    }}
                    onBlur={() => {
                      setErrors((prev) => ({ ...prev, name: validateName(name) }));
                    }}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "signup-name-error" : undefined}
                    placeholder="Display name"
                    className="input-field input-field-with-icon"
                    style={{ paddingLeft: "2.75rem" }}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {errors.name && (
                  <p id="signup-name-error" role="alert" className="text-xs text-rose-400 mt-1">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email"
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
                    aria-describedby={errors.email ? "signup-email-error" : undefined}
                    placeholder="you@example.com"
                    className="input-field input-field-with-icon"
                    style={{ paddingLeft: "2.75rem" }}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {errors.email && (
                  <p id="signup-email-error" role="alert" className="text-xs text-rose-400 mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPassword(val);
                      if (errors.password && validatePassword(val) === null) {
                        setErrors((prev) => ({ ...prev, password: null }));
                      }
                      if (confirmPassword && errors.confirmPassword && val === confirmPassword) {
                        setErrors((prev) => ({ ...prev, confirmPassword: null }));
                      }
                    }}
                    onBlur={() => {
                      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
                    }}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "signup-password-error" : undefined}
                    placeholder="At least 8 characters"
                    className="input-field input-field-with-icon"
                    style={{ paddingLeft: "2.75rem" }}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {errors.password && (
                  <p id="signup-password-error" role="alert" className="text-xs text-rose-400 mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfirmPassword(val);
                      if (errors.confirmPassword && validateConfirmPassword(val, password) === null) {
                        setErrors((prev) => ({ ...prev, confirmPassword: null }));
                      }
                    }}
                    onBlur={() => {
                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: validateConfirmPassword(confirmPassword, password),
                      }));
                    }}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "signup-confirm-password-error" : undefined}
                    placeholder="Re-enter password"
                    className="input-field input-field-with-icon"
                    style={{ paddingLeft: "2.75rem" }}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <p
                    id="signup-confirm-password-error"
                    role="alert"
                    className="text-xs text-rose-400 mt-1"
                  >
                    {errors.confirmPassword}
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
                    <span>Creating account...</span>
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm text-zinc-400">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-accent hover:text-accent-hover transition-colors">
                  Login
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

export default Signup;
