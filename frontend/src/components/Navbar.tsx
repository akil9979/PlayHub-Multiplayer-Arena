import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Gamepad2 } from "lucide-react";
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
    event: MouseEvent<HTMLAnchorElement>,
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
    connected: "bg-emerald-400 ring-2 ring-emerald-500/30",
    connecting: "bg-amber-400 animate-pulse ring-2 ring-amber-500/30",
    disconnected: "bg-zinc-500",
    error: "bg-rose-500",
  }[socketStatus];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#0a0a0b]/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to={brandPath}
          className="group flex items-center gap-2.5 transition-transform duration-150 active:scale-95"
          onClick={(event) => {
            if (mode === "public") {
              handleNavLinkClick(event, "/#home");
            } else {
              closeMobile();
            }
          }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-accent transition-colors group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 shadow-[0_0_12px_-2px_rgba(34,197,94,0.3)]">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <span className="font-display text-lg font-bold tracking-wider text-white">
            PLAY<span className="text-accent">HUB</span>
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
                className={`relative px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-150 ${
                  isActive
                    ? "text-white bg-zinc-800/80 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {mode === "authenticated" && user ? (
            <>
              <Link
                to="/profile"
                className="group flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-[#121216] py-1.5 pl-2 pr-3.5 transition-all duration-150 hover:border-zinc-700 hover:bg-[#16161c] shadow-sm"
                title="View Profile"
              >
                <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white border border-zinc-700/60">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#121216] ${socketDotClass}`}
                    aria-label={socketLabel}
                  />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold leading-tight text-zinc-100 group-hover:text-white">
                    {user.name}
                  </p>
                  <p className="text-[10px] leading-tight text-zinc-400 font-medium">
                    {socketLabel}
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-all duration-150 hover:bg-rose-900/40 hover:text-rose-200 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                <span>{isLoggingOut ? "Leaving..." : "Logout"}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-all duration-150 hover:bg-accent-hover shadow-[0_0_16px_-2px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_-2px_rgba(34,197,94,0.45)] active:scale-95"
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
              className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white border border-zinc-700"
              aria-label="Open profile"
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#0a0a0b] ${socketDotClass}`}
                aria-label={socketLabel}
              />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-zinc-800 bg-[#121216] p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          className="space-y-1.5 border-b border-zinc-800 bg-[#0a0a0b]/95 backdrop-blur-md px-4 pb-4 pt-2 md:hidden animate-fade-in"
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
                    ? "text-white bg-zinc-800/80 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {mode === "authenticated" && user ? (
            <div className="flex items-center justify-between border-t border-zinc-800 pt-3 mt-2">
              <div className="text-xs text-zinc-400">
                Logged in as{" "}
                <span className="font-semibold text-white">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-t border-zinc-800 pt-3 mt-2">
              <Link
                to="/login"
                onClick={closeMobile}
                className="flex-1 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white py-2"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={closeMobile}
                className="flex-1 rounded-lg bg-accent px-3 py-2 text-center text-xs font-semibold text-zinc-950 hover:bg-accent-hover transition-colors shadow-sm"
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
