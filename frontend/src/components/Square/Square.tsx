import type { Cell } from "../../types/game";

interface SquareProps {
  value: Cell;
  onClick: () => void;
  disabled?: boolean;
}

export default function Square({ value, onClick, disabled }: SquareProps) {
  const isPlayable = !disabled && value === null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || value !== null}
      className={`
        relative flex aspect-square w-full h-full
        items-center justify-center
        rounded-lg sm:rounded-xl
        border transition-colors duration-150
        select-none
        ${
          value === "circle"
            ? "border-[#5ab0e6]/40 bg-[#111113] text-[#5ab0e6] cursor-default"
            : value === "cross"
              ? "border-[#7c6ee6]/40 bg-[#111113] text-[#7c6ee6] cursor-default"
              : isPlayable
                ? "border-[#27272a] bg-[#111113] hover:border-zinc-500 hover:bg-[#18181b] cursor-pointer"
                : "border-[#27272a] bg-[#0a0a0b] cursor-not-allowed opacity-60"
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
          className="h-[55%] w-[55%] text-[#5ab0e6]"
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
          className="h-[55%] w-[55%] text-[#7c6ee6]"
          aria-hidden="true"
        >
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </svg>
      )}
    </button>
  );
}