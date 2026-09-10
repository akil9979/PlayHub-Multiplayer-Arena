import type { Cell } from "../../types/game";

interface SquareProps {
  value: Cell;
  onClick: () => void;
  disabled?: boolean;
}

export default function Square({ value, onClick, disabled }: SquareProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || value !== null}
      className={`
        relative flex h-24 w-24 sm:h-28 sm:w-28
        items-center justify-center
        rounded-2xl
        border transition-all duration-200
        select-none
        ${
          value === "circle"
            ? "border-cyan-500/50 bg-slate-900/90 text-cyan-400 shadow-lg shadow-cyan-500/20"
            : value === "cross"
              ? "border-purple-500/50 bg-slate-900/90 text-purple-400 shadow-lg shadow-purple-500/20"
              : disabled
                ? "border-slate-800 bg-slate-950/60 cursor-not-allowed opacity-60"
                : "border-slate-800/80 bg-slate-900/70 hover:border-indigo-500/50 hover:bg-slate-800/80 hover:scale-[1.03] active:scale-95 cursor-pointer shadow-md"
        }
      `}
    >
      {value === "circle" && (
        <span className="text-4xl sm:text-5xl font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]">
          O
        </span>
      )}
      {value === "cross" && (
        <span className="text-4xl sm:text-5xl font-black text-purple-400 drop-shadow-[0_0_12px_rgba(192,132,252,0.6)]">
          X
        </span>
      )}
    </button>
  );
}