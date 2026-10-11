import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getErrorMessage } from "../utils/apiError";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password.trim()) {
      setError("All fields are required.");
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/users/create", {
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      setSuccess("Account created successfully! Redirecting to login...");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

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
        <div className="relative grid w-full max-w-5xl overflow-hidden rounded-xl border border-[#27272a] bg-[#111113] lg:grid-cols-2">
          <aside className="relative hidden overflow-hidden border-r border-[#27272a] bg-[#0a0a0b] p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="font-display text-sm font-bold tracking-[0.2em] text-[#fafafa]">
                PLAYHUB
              </p>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#fafafa]">
                Create your player profile
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
                Join the arena, challenge rivals in real time, and start building
                your competitive record.
              </p>
            </div>

            <ul className="mt-10 space-y-3 text-sm text-[#fafafa]">
              <li className="rounded-lg border border-[#27272a] bg-[#111113] px-4 py-3">
                Live Tic-Tac-Toe multiplayer
              </li>
              <li className="rounded-lg border border-[#27272a] bg-[#111113] px-4 py-3">
                Online challenges & private rooms
              </li>
              <li className="rounded-lg border border-[#27272a] bg-[#111113] px-4 py-3">
                Match history & leaderboard ranks
              </li>
            </ul>

            <p className="text-xs text-[#71717a]">Free to join • Instant play</p>
          </aside>

          <section className="animate-fade-in flex flex-col justify-center p-6 sm:p-10">
            <div className="mb-8 space-y-2 lg:hidden">
              <p className="font-display text-sm font-bold tracking-[0.2em] text-[#fafafa]">
                PLAYHUB
              </p>
              <h1 className="text-2xl font-extrabold text-[#fafafa]">Create account</h1>
            </div>

            <div className="mb-6 hidden lg:block">
              <h2 className="text-2xl font-extrabold text-[#fafafa]">Sign Up</h2>
              <p className="mt-1 text-sm text-[#a1a1aa]">
                Set up your PlayHub account to start playing.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4" noValidate>
              {error && <ErrorMessage compact message={error} onDismiss={() => setError(null)} />}
              {success && (
                <div
                  role="status"
                  className="rounded-lg border border-[#22c55e]/40 bg-[#22c55e]/10 px-4 py-3 text-sm text-[#22c55e]"
                >
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="signup-name" className="text-sm font-medium text-[#a1a1aa]">
                  Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name"
                  className="input-field"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="signup-email" className="text-sm font-medium text-[#a1a1aa]">
                  Email
                </label>
                <input
                  id="signup-email"
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
                <label htmlFor="signup-password" className="text-sm font-medium text-[#a1a1aa]">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input-field"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="signup-confirm-password"
                  className="text-sm font-medium text-[#a1a1aa]"
                >
                  Confirm password
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="input-field"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" className="text-[#052e16]" />
                    <span>Creating account...</span>
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm text-[#a1a1aa]">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-[#fafafa] hover:underline">
                  Login
                </Link>
              </p>
              <Link to="/" className="inline-flex font-medium text-[#71717a] hover:text-[#fafafa]">
                ← Back to Landing
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Signup;
