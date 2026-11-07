import type { Cell } from "../../types/game";

interface SquareProps {
  index: number;
  value: Cell;
  onClick: () => void;
  disabled?: boolean;
  isWinning?: boolean;
}

export default function Square({
  index,
  value,
  onClick,
  disabled,
  isWinning = false,
}: SquareProps) {
  const isPlayable = !disabled && value === null;
  const row = Math.floor(index / 3) + 1;
  const column = (index % 3) + 1;
  const stateLabel =
    value === "circle"
      ? "Circle"
      : value === "cross"
        ? "Cross"
        : "Empty square";
  const ariaLabel = `${stateLabel}, row ${row}, column ${column}`;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled || value !== null}
      className={`
        relative flex aspect-square w-full h-full
        items-center justify-center
        rounded-xl sm:rounded-2xl
        border transition-all duration-150
        select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
        ${
          isWinning
            ? "border-accent bg-emerald-950/40 shadow-[0_0_24px_rgba(34,197,94,0.4)] animate-pulse"
            : value === "circle"
            ? "border-cyan-500/40 bg-cyan-950/20 text-cyan-400 cursor-default shadow-sm"
            : value === "cross"
            ? "border-purple-500/40 bg-purple-950/20 text-purple-400 cursor-default shadow-sm"
            : isPlayable
            ? "border-zinc-800 bg-[#121217] hover:border-zinc-600 hover:bg-[#181820] hover:shadow-inner cursor-pointer active:scale-95"
            : "border-zinc-850 bg-[#0c0c0f] cursor-not-allowed opacity-60"
        }
      `}
    >
      {value === "circle" && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[55%] w-[55%] text-cyan-400 animate-mark-pop drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
      {value === "cross" && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[55%] w-[55%] text-purple-400 animate-mark-pop drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          aria-hidden="true"
        >
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </svg>
      )}
      {isPlayable && (
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-700/50 opacity-0 transition-opacity hover:opacity-100" />
      )}
    </button>
  );
}
