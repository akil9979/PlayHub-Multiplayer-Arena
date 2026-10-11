import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hook";
import { logout } from "../redux/slices/authSlice";
import api from "../api/axios";
import { useSocketStatus } from "../utils/useSocketStatus";

type NavbarVariant = "auto" | "public" | "authenticated";

type NavbarProps = {
  variant?: NavbarVariant;
};

const AUTH_LINKS = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Play Game", path: "/game" },
  { name: "Leaderboard", path: "/leaderboard" },
  { name: "My Profile", path: "/profile" },
];

const PUBLIC_LINKS = [
  { name: "Home", path: "/#home" },
  { name: "Games", path: "/#featured-games" },
  { name: "How It Works", path: "/#how-it-works" },
  { name: "Leaderboard", path: "/leaderboard" },
];

const LANDING_SECTION_IDS = ["home", "featured-games", "how-it-works"] as const;

function getHashFromPath(path: string): string {
  const hashIndex = path.indexOf("#");
  return hashIndex >= 0 ? path.slice(hashIndex) : "";
}

function scrollToSection(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;

  const el = document.getElementById(id);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Navbar({ variant = "auto" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const suppressScrollSpyUntil = useRef(0);
  const hasScrolledForLandingEntry = useRef(false);

  const mode =
    variant === "auto"
      ? isAuthenticated
        ? "authenticated"
        : "public"
      : variant;

  const navLinks = mode === "authenticated" ? AUTH_LINKS : PUBLIC_LINKS;
  const brandPath = mode === "authenticated" ? "/dashboard" : "/#home";

  // Keep landing section hash in sync while scrolling so only one nav item stays active.
  useEffect(() => {
    if (mode !== "public" || location.pathname !== "/") {
      return;
    }

    const sections = LANDING_SECTION_IDS.map((id) =>
      document.getElementById(id)
    ).filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Ignore scroll-spy updates while a nav click is animating to a section
        if (Date.now() < suppressScrollSpyUntil.current) {
          return;
        }

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const top = visible[0];
        if (!top?.target.id) {
          return;
        }

        const nextHash = `#${top.target.id}`;
        if (window.location.hash === nextHash) {
          return;
        }

        navigate({ pathname: "/", hash: top.target.id }, { replace: true });
      },
      {
        root: null,
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [mode, location.pathname, navigate]);

  // Scroll to hash only when first entering the landing page (refresh / external link).
  // Do not scroll on every hash change — scroll-spy updates the hash while the user scrolls.
  useEffect(() => {
    if (location.pathname !== "/") {
      hasScrolledForLandingEntry.current = false;
      return;
    }

    if (hasScrolledForLandingEntry.current) {
      return;
    }

    hasScrolledForLandingEntry.current = true;

    const hash = location.hash;
    if (!hash || hash === "#home") {
      return;
    }

    suppressScrollSpyUntil.current = Date.now() + 900;
    const frame = window.requestAnimationFrame(() => {
      scrollToSection(hash);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  const closeMobile = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.get("/users/logout");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      dispatch(logout());
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActivePath = (path: string) => {
    // Authenticated app routes: exact pathname match only
    if (mode === "authenticated") {
      return location.pathname === path;
    }

    // Leaderboard is a separate page — never share active state with landing sections
    if (path === "/leaderboard") {
      return location.pathname === "/leaderboard";
    }

    // Landing section links are only active on `/`
    if (location.pathname !== "/") {
      return false;
    }

    const targetHash = getHashFromPath(path) || "#home";
    const currentHash = location.hash || "#home";

    return currentHash === targetHash;
  };

  const handleNavLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    path: string
  ) => {
    const hash = getHashFromPath(path);

    // Non-hash routes (e.g. Leaderboard) use normal React Router navigation
    if (!hash) {
      closeMobile();
      return;
    }

    event.preventDefault();
    suppressScrollSpyUntil.current = Date.now() + 1000;
    closeMobile();

    if (location.pathname !== "/" || location.hash !== hash) {
      navigate({ pathname: "/", hash: hash.slice(1) });
    }

    window.requestAnimationFrame(() => {
      scrollToSection(hash);
    });
  };

  const { status: socketStatus } = useSocketStatus();

  const socketLabel = {
    connected: "Online",
    connecting: "Connecting...",
    disconnected: "Offline",
    error: "Disconnected",
  }[socketStatus];

  const socketDotClass = {
    connected: "bg-emerald-500",
    connecting: "bg-amber-400 animate-pulse",
    disconnected: "bg-zinc-500",
    error: "bg-red-500",
  }[socketStatus];

  return (
    <header className="sticky top-0 z-50 border-b border-[#27272a] bg-[#0a0a0b]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to={brandPath}
          className="flex items-center gap-2"
          onClick={(event) => {
            if (mode === "public") {
              handleNavLinkClick(event, "/#home");
            } else {
              closeMobile();
            }
          }}
        >
          <span className="font-display text-lg font-bold tracking-wider text-[#fafafa]">
            PLAYHUB
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {navLinks.map((link) => {
            const isActive = isActivePath(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={(event) => handleNavLinkClick(event, link.path)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-[#fafafa] font-semibold"
                    : "text-zinc-400 hover:text-[#fafafa]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {mode === "authenticated" && user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-lg border border-[#27272a] bg-[#111113] py-1.5 pl-2 pr-3.5 transition-colors hover:border-[#3f3f46] hover:bg-[#18181b]"
                title="View Profile"
              >
                <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#27272a] text-xs font-bold text-[#fafafa]">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  <span
                    className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#111113] ${socketDotClass}`}
                    aria-label={socketLabel}
                  />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold leading-tight text-[#fafafa]">
                    {user.name}
                  </p>
                  <p className="text-[10px] leading-tight text-zinc-400">{socketLabel}</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>{isLoggingOut ? "Leaving..." : "Logout"}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-400 hover:text-[#fafafa] transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-[#fafafa] px-3.5 py-1.5 text-xs font-semibold text-[#0a0a0b] transition-colors hover:bg-zinc-200"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {mode === "authenticated" && user && (
            <Link
              to="/profile"
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#27272a] text-xs font-bold text-[#fafafa] border border-[#27272a]"
              aria-label="Open profile"
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              <span
                className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#0a0a0b] ${socketDotClass}`}
                aria-label={socketLabel}
              />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-[#27272a] bg-[#111113] p-2 text-zinc-400 hover:text-white hover:bg-[#18181b]"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          className="space-y-2 border-b border-[#27272a] bg-[#0a0a0b] px-4 pb-4 pt-2 md:hidden"
        >
          {navLinks.map((link) => {
            const isActive = isActivePath(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={(event) => handleNavLinkClick(event, link.path)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-[#fafafa] bg-[#18181b] font-semibold"
                    : "text-zinc-400 hover:bg-[#18181b] hover:text-[#fafafa]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {mode === "authenticated" && user ? (
            <div className="flex items-center justify-between border-t border-[#27272a] pt-3">
              <div className="text-xs text-zinc-400">
                Logged in as{" "}
                <span className="font-semibold text-[#fafafa]">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-t border-[#27272a] pt-3">
              <Link
                to="/login"
                onClick={closeMobile}
                className="flex-1 text-center text-xs font-medium text-zinc-400 hover:text-white py-2"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={closeMobile}
                className="flex-1 rounded-lg bg-[#fafafa] px-3 py-2 text-center text-xs font-semibold text-[#0a0a0b] hover:bg-zinc-200 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
